// src/shopify.connector.server.ts
//
// Server handler for the single Shopify data connector. Runs inside the
// app-runtime sandbox and serves THREE streams off the one connector:
//   • `customer` → REST /customers.json, contributes into the system `contact` def.
//   • `order`    → REST /orders.json (line items embedded), fans out into
//                  shopify_orders + shopify_line_items + the contact/product edges.
//   • `product`  → REST /products.json, populates the owned shopify_products def the
//                  order stream's `line_items[].product_id` reference links to.
//
// All three share the same "one page + page_info cursor" contract
// (`fetchShopifyPage`): return ONE page of records plus a flat cursor, and the
// platform re-invokes with `state.cursor` until `backfillComplete`. Raw `fetch` is
// used (not the shared shopifyApi helpers) for header access — the shared helpers
// return parsed JSON with no headers and auto-drain every page, neither of which
// fits the per-page contract. A 429 is surfaced as `rateLimited` (not thrown) so
// the platform pauses + re-enqueues from the same cursor.
//
// Connection contract: resolve from `args.connection` — `value` is the Admin API
// access token, `metadata` carries the shop domain.

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { getShopDomain } from './blocks/shopify/shared/shopify-api'

const API_VERSION = '2024-10'
const PAGE_SIZE = 250

/** Extract the `page_info` token of the `rel="next"` link from a Link header. */
function nextPageInfo(linkHeader: string | null): string | undefined {
  return linkHeader?.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/)?.[1]
}

/**
 * Fetch ONE page of a Shopify REST collection and project it into source-shaped
 * records. Shared by every stream: same page_info cursor, same incremental
 * `updated_at` watermark, same 429 → `rateLimited` handling. `toRecord` projects one
 * raw row; `firstPageParams` are filters that ride page 1 only (Shopify forbids any
 * other filter once `page_info` is set — the token encodes them).
 */
async function fetchShopifyPage<Raw extends { updated_at: string }>(
  args: ConnectorExecuteArgs,
  opts: {
    resource: 'customers' | 'orders' | 'products'
    rootKey: 'customers' | 'orders' | 'products'
    toRecord: (raw: Raw) => ConnectorRecord
    firstPageParams?: Record<string, string>
  }
): Promise<ConnectorFetchResult> {
  const { mode, state, connection } = args
  if (!connection?.value) {
    throw new Error('shopify: missing connection (requiresConnection)')
  }
  const token = connection.value
  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) {
    throw new Error('shopify: connection metadata is missing the shop domain')
  }

  const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (state.cursor) {
    params.set('page_info', String(state.cursor))
  } else {
    for (const [k, v] of Object.entries(opts.firstPageParams ?? {})) {
      params.set(k, v)
    }
    if (mode === 'incremental' && state.updatedSince) {
      params.set('updated_at_min', String(state.updatedSince))
    }
  }

  const res = await fetch(
    `https://${shopDomain}/admin/api/${API_VERSION}/${opts.resource}.json?${params}`,
    { headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' } }
  )

  // Throttled — pause + retry THIS page from the same cursor (don't burn the budget).
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After'))
    return {
      records: [],
      nextState: { cursor: state.cursor, updatedSince: state.updatedSince },
      rateLimited: { retryAfterMs: Number.isFinite(retryAfter) ? retryAfter * 1000 : undefined },
    }
  }
  if (!res.ok) {
    throw new Error(`shopify: Admin API responded ${res.status} for ${opts.resource}`)
  }

  const rows = ((await res.json()) as Record<string, Raw[] | undefined>)[opts.rootKey] ?? []
  const next = nextPageInfo(res.headers.get('Link'))
  // High-water mark of `updated_at` so the next incremental run resumes from it.
  const lastUpdated = rows[rows.length - 1]?.updated_at ?? state.updatedSince

  return {
    records: rows.map(opts.toRecord),
    nextState: next
      ? // More pages in this chain — keep the page cursor, hold the watermark.
        { cursor: next, updatedSince: state.updatedSince }
      : // Chain done — drop the cursor, advance the watermark for the next run.
        { cursor: undefined, updatedSince: lastUpdated, backfillComplete: true },
  }
}

// ── customer stream ────────────────────────────────────────────────────────────

interface RawCustomer {
  id: number
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  orders_count: number
  total_spent: string
  created_at: string
  updated_at: string
}

/** Project one REST customer into a SOURCE-shaped record (fields keyed by sourcePath). */
function toCustomerRecord(c: RawCustomer): ConnectorRecord {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return {
    streamKey: 'customer',
    externalId: String(c.id),
    // displayName tolerates guests/phone-only customers: email → name → id.
    displayName: c.email ?? (name || String(c.id)),
    fields: {
      id: String(c.id),
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      orders_count: c.orders_count,
      total_spent: c.total_spent,
      created_at: c.created_at,
    },
  }
}

// ── order stream ───────────────────────────────────────────────────────────────

interface RawLineItem {
  title: string | null
  sku: string | null
  quantity: number | null
  price: string | null
  product_id: number | null
}

interface RawOrder {
  id: number
  name: string | null
  order_number?: number
  total_price: string | null
  financial_status: string | null
  fulfillment_status: string | null
  created_at: string
  updated_at: string
  customer: {
    email: string | null
    first_name: string | null
    last_name: string | null
  } | null
  line_items: RawLineItem[] | null
}

/** Project one REST order into a SOURCE-shaped record (fields keyed by sourcePath). */
function toOrderRecord(o: RawOrder): ConnectorRecord {
  return {
    streamKey: 'order',
    externalId: String(o.id),
    displayName: o.name ?? `#${o.order_number ?? o.id}`,
    fields: {
      id: String(o.id),
      name: o.name,
      total_price: o.total_price,
      financial_status: o.financial_status,
      fulfillment_status: o.fulfillment_status,
      created_at: o.created_at,
      customer: o.customer
        ? {
            email: o.customer.email,
            first_name: o.customer.first_name,
            last_name: o.customer.last_name,
          }
        : null,
      // Raw array — the platform fans each element out per the `line_items[]` mapping.
      // `product_id` is stringified to match the product stream's `externalId` so the
      // line→product reference links.
      line_items: (o.line_items ?? []).map((li) => ({
        title: li.title,
        sku: li.sku,
        quantity: typeof li.quantity === 'number' ? li.quantity : null,
        price: li.price,
        product_id: li.product_id != null ? String(li.product_id) : null,
      })),
    },
  }
}

// ── product stream ─────────────────────────────────────────────────────────────

interface RawProduct {
  id: number
  title: string | null
  vendor: string | null
  product_type: string | null
  handle: string | null
  status: string | null
  tags: string | null
  created_at: string
  updated_at: string
}

/**
 * Project one REST product into a SOURCE-shaped record. `externalId` is the numeric
 * product id stringified — the SAME value the order stream emits for
 * `line_items[].product_id`, so the reference edge links a line item to its product.
 */
function toProductRecord(p: RawProduct): ConnectorRecord {
  return {
    streamKey: 'product',
    externalId: String(p.id),
    displayName: p.title ?? String(p.id),
    fields: {
      id: String(p.id),
      title: p.title,
      vendor: p.vendor,
      product_type: p.product_type,
      handle: p.handle,
      status: p.status,
      tags: p.tags,
      created_at: p.created_at,
    },
  }
}

export default async function shopifySync(
  args: ConnectorExecuteArgs
): Promise<ConnectorFetchResult> {
  switch (args.streamKey) {
    case 'customer':
      return fetchShopifyPage<RawCustomer>(args, {
        resource: 'customers',
        rootKey: 'customers',
        toRecord: toCustomerRecord,
      })
    case 'order':
      return fetchShopifyPage<RawOrder>(args, {
        resource: 'orders',
        rootKey: 'orders',
        toRecord: toOrderRecord,
        // `status=any` so cancelled/archived orders backfill too.
        firstPageParams: { status: 'any' },
      })
    case 'product':
      return fetchShopifyPage<RawProduct>(args, {
        resource: 'products',
        rootKey: 'products',
        toRecord: toProductRecord,
      })
    default:
      throw new Error(`shopify: unknown stream "${args.streamKey}"`)
  }
}
