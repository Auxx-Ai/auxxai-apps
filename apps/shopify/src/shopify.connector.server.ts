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
//
// The `order` projection also SYNTHESISES a `derived` object at the order root and on
// each line item (`deriveFulfillments`), rolling `order.fulfillments[]` up into ship
// dates, shipped quantities and per-line shipment counts. Nothing in Shopify's payload
// carries a ship date at the order or line level — it exists only inside
// `fulfillments[]` — and accrual revenue is recognised at fulfillment, so this walk is
// what makes a period cut possible. `shipment_count` is the honesty column: where it is
// 1 the derived dates are exact, and where it is >1 the close job knows to look closer.

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { getShopDomain, getShopifyToken } from './blocks/shopify/shared/shopify-api'

const API_VERSION = '2024-10'
const PAGE_SIZE = 250

/** Extract the `page_info` token of the `rel="next"` link from a Link header. */
function nextPageInfo(linkHeader: string | null): string | undefined {
  return linkHeader?.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/)?.[1]
}

/**
 * Latest `updated_at` across a page, compared by epoch and returned as the original
 * ISO string. Falls back to `fallback` when the page is empty or holds no parseable
 * timestamp — never returns a value older than the mark we came in with.
 */
function maxUpdatedAt<Raw extends { updated_at: string }>(
  rows: Raw[],
  fallback: unknown
): string | undefined {
  const base = typeof fallback === 'string' ? fallback : undefined
  let best = base
  let bestMs = base ? Date.parse(base) : Number.NEGATIVE_INFINITY
  if (Number.isNaN(bestMs)) bestMs = Number.NEGATIVE_INFINITY
  for (const row of rows) {
    const ms = Date.parse(row.updated_at)
    if (Number.isNaN(ms) || ms <= bestMs) continue
    bestMs = ms
    best = row.updated_at
  }
  return best
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
  const token = getShopifyToken(connection)
  if (!token) {
    throw new Error('shopify: missing connection (requiresConnection)')
  }
  const shopDomain = getShopDomain(connection?.metadata)
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
  //
  // Take the MAX across the page, never `rows[rows.length - 1]`. Shopify's REST
  // collections default to **`id` descending** — verified against a live store:
  // `updated_at` is neither ascending nor descending within a page (an old order
  // edited yesterday still sorts first by id). Reading the last row therefore yields
  // an arbitrary `updated_at`, which fails two ways:
  //   • it is usually the OLDEST value, so `updated_at_min` never advances and every
  //     incremental run re-crawls the entire history; and
  //   • if the lowest-id row happens to be a recently-edited order, the mark jumps
  //     forward and silently SKIPS every row updated in between.
  // Comparison is by epoch, not lexicographic: Shopify stamps shop-local offsets, so
  // strings either side of a DST change do not sort correctly as text.
  const lastUpdated = maxUpdatedAt(rows, state.updatedSince)

  return {
    records: rows.map(opts.toRecord),
    nextState: next
      ? // More pages in this chain — keep the page cursor, hold the watermark.
        { cursor: next, updatedSince: state.updatedSince }
      : // Chain done — drop the cursor, advance the watermark for the next run.
        { cursor: undefined, updatedSince: lastUpdated, backfillComplete: true },
  }
}

// ── shared projection helpers ────────────────────────────────────────────────

/** A Shopify REST address object (customer default_address / order ship/bill). */
interface RawAddress {
  address1?: string | null
  address2?: string | null
  city?: string | null
  province?: string | null
  zip?: string | null
  country?: string | null
}

/**
 * Shape a Shopify address into the platform's ADDRESS_STRUCT value
 * (`{ street1, street2, city, state, zipCode, country }`). Returns null when the
 * order/customer has no address so the field stays empty rather than all-blank.
 */
function toAddressStruct(addr: RawAddress | null | undefined) {
  if (!addr) return null
  return {
    street1: addr.address1 ?? '',
    street2: addr.address2 ?? '',
    city: addr.city ?? '',
    state: addr.province ?? '',
    zipCode: addr.zip ?? '',
    country: addr.country ?? '',
  }
}

/**
 * Normalise Shopify's `tags` for a TAGS column.
 *
 * Shopify already hands `tags` over as a comma-joined STRING (`'vip, gift'`), and a
 * comma string is exactly what the platform's `normalizeFieldValue` splits into tag
 * values. Do NOT split it into an array here: the fan-out drops any array-shaped
 * source value before the field-value layer is reached (`hasArrayShapedSource` —
 * "connectors cannot source arrays"), so an array write is silently discarded. That
 * is why the `tags` column on both shopify_orders and shopify_products had never
 * synced a single value.
 */
function toTagString(tags: string | null | undefined): string {
  return tags ?? ''
}

/**
 * Shopify returns `null` fulfillment_status for an unfulfilled order/line; project
 * it to the explicit `'unfulfilled'` enum value so the SINGLE_SELECT chip is set.
 */
function fulfillmentStatus(raw: string | null | undefined): string {
  return raw ?? 'unfulfilled'
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
  note: string | null
  created_at: string
  updated_at: string
  default_address: RawAddress | null
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
      note: c.note,
      created_at: c.created_at,
      // Flattened default-address scalars — bound onto the contact's city/region/country.
      default_address: c.default_address
        ? {
            city: c.default_address.city ?? null,
            province: c.default_address.province ?? null,
            country: c.default_address.country ?? null,
          }
        : null,
    },
  }
}

// ── order stream ───────────────────────────────────────────────────────────────

interface RawLineItem {
  id: number | null
  title: string | null
  variant_title: string | null
  variant_id: number | null
  sku: string | null
  vendor: string | null
  quantity: number | null
  /** Units still awaiting shipment. Real Shopify field — makes the "paid but
   *  unfulfilled at the cutoff" deferred-revenue report exact rather than inferred
   *  from a status enum. */
  fulfillable_quantity: number | null
  price: string | null
  fulfillment_status: string | null
  product_id: number | null
}

/**
 * One line inside a fulfillment. Deliberately NOT `RawLineItem`: the shapes overlap,
 * but `quantity` here means "units shipped IN THIS FULFILLMENT", not units ordered.
 * Conflating the two is precisely the split-shipment bug these fields exist to avoid.
 */
interface RawFulfillmentLine {
  id: number | null
  variant_id: number | null
  sku: string | null
  quantity: number | null
}

/**
 * One shipment against an order (`order.fulfillments[]`). This array is part of the
 * Order REST resource and rides `read_orders` — the `read_*_fulfillment_orders` scopes
 * govern the separate FulfillmentOrder endpoints, which this connector never calls.
 *
 * `created_at` is the SHIP DATE and the revenue-recognition trigger. Never `updated_at`:
 * that moves on every carrier tracking update, which would drag the recognition date
 * forward days after delivery.
 */
interface RawFulfillment {
  id: number | null
  name: string | null
  /** Lifecycle: pending | open | success | cancelled | error | failure. */
  status: string | null
  /** Carrier tracking state; frequently null. Informational only. */
  shipment_status: string | null
  created_at: string | null
  updated_at: string | null
  tracking_number: string | null
  tracking_company: string | null
  tracking_url: string | null
  location_id: number | null
  line_items: RawFulfillmentLine[] | null
}

/** Per-line rollup of every non-cancelled fulfillment touching that line. */
interface LineFulfillmentDerivation {
  fulfilled_at: string | null
  last_fulfilled_at: string | null
  fulfilled_quantity: number
  shipment_count: number
  tracking_number: string | null
}

interface OrderFulfillmentDerivation {
  order: {
    first_fulfilled_at: string | null
    last_fulfilled_at: string | null
    shipment_count: number
    is_split_shipment: boolean
  }
  byLineId: Map<string, LineFulfillmentDerivation>
}

/**
 * Walk `order.fulfillments[]` once and roll it up to the order and to each line.
 *
 * Cancelled fulfillments are EXCLUDED from every date, count and quantity — a shipment
 * that was undone must not set a recognition date.
 *
 * Dates are compared by epoch and stored as the original ISO string. Shopify stamps
 * shop-local offsets, so `-05:00` and `-04:00` values coexist across a DST change and
 * text comparison would order them wrongly — which would land a shipment in the wrong
 * period at exactly the fiscal boundary this feature exists to get right.
 *
 * `tracking_number` is only carried onto a line when that line shipped exactly once.
 * With two shipments there is no single tracking number for the line, and guessing one
 * would be worse than leaving it null; `shipment_count` is the column that says so.
 */
function deriveFulfillments(o: RawOrder): OrderFulfillmentDerivation {
  const live = (o.fulfillments ?? []).filter((f) => f.status !== 'cancelled')

  let firstMs = Number.POSITIVE_INFINITY
  let lastMs = Number.NEGATIVE_INFINITY
  let firstAt: string | null = null
  let lastAt: string | null = null
  const byLineId = new Map<string, LineFulfillmentDerivation>()

  for (const f of live) {
    const at = f.created_at ?? null
    const ms = at ? Date.parse(at) : Number.NaN
    if (at && !Number.isNaN(ms)) {
      if (ms < firstMs) [firstMs, firstAt] = [ms, at]
      if (ms > lastMs) [lastMs, lastAt] = [ms, at]
    }

    for (const li of f.line_items ?? []) {
      if (li.id == null) continue
      const key = String(li.id)
      const cur: LineFulfillmentDerivation = byLineId.get(key) ?? {
        fulfilled_at: null,
        last_fulfilled_at: null,
        fulfilled_quantity: 0,
        shipment_count: 0,
        tracking_number: null,
      }
      cur.shipment_count += 1
      cur.fulfilled_quantity += typeof li.quantity === 'number' ? li.quantity : 0
      if (at && !Number.isNaN(ms)) {
        const curFirst = cur.fulfilled_at ? Date.parse(cur.fulfilled_at) : Number.POSITIVE_INFINITY
        const curLast = cur.last_fulfilled_at
          ? Date.parse(cur.last_fulfilled_at)
          : Number.NEGATIVE_INFINITY
        if (ms < curFirst) cur.fulfilled_at = at
        if (ms > curLast) cur.last_fulfilled_at = at
      }
      // Meaningful only for a single-shipment line — see the docblock.
      cur.tracking_number = cur.shipment_count === 1 ? (f.tracking_number ?? null) : null
      byLineId.set(key, cur)
    }
  }

  return {
    order: {
      first_fulfilled_at: firstAt,
      last_fulfilled_at: lastAt,
      shipment_count: live.length,
      is_split_shipment: live.length > 1,
    },
    byLineId,
  }
}

interface RawOrder {
  id: number
  name: string | null
  order_number?: number
  email: string | null
  currency: string | null
  total_price: string | null
  subtotal_price: string | null
  total_tax: string | null
  total_discounts: string | null
  financial_status: string | null
  fulfillment_status: string | null
  cancel_reason: string | null
  /**
   * Gateways across ALL of the order's transactions — the routing key for the
   * checkout debit. `order.gateway` and `order.processing_method` are both deprecated;
   * this is the current field. ⚠️ It includes gateways from FAILED transactions, so a
   * declined-Affirm-then-paid-by-card order reads `['affirm','shopify_payments']` and a
   * naive `includes('affirm')` mis-routes. Resolve a multi-value order against
   * `/orders/{id}/transactions.json` before trusting it.
   */
  payment_gateway_names: string[] | null
  tags: string | null
  note: string | null
  created_at: string
  updated_at: string
  processed_at: string | null
  cancelled_at: string | null
  /** Shipments. Present on the Order resource by default — the connector sends no
   *  `fields=` param, and Shopify's `fields` filter is top-level-only. */
  fulfillments: RawFulfillment[] | null
  shipping_address: RawAddress | null
  billing_address: RawAddress | null
  customer: {
    id: number | null
    email: string | null
    first_name: string | null
    last_name: string | null
  } | null
  line_items: RawLineItem[] | null
}

/**
 * Shopify reports money as a DECIMAL MAJOR-UNIT STRING (`"49.99"`). The platform
 * stores `FieldType.CURRENCY` as INTEGER MINOR UNITS (`4999`), so every money
 * field has to be scaled on the way out of this projection.
 *
 * This is the app's job, not the platform's: `ConnectorFieldDecl.sourcePath` is a
 * JSON path with no transform channel, and the platform cannot tell `49.99`-as-
 * dollars from `49.99`-as-cents once the unit is dropped. Passing these through
 * raw is what stored 139 Shopify money rows 100x low.
 *
 * Returns null (not 0) for an absent value: a missing price is "no value", and
 * writing 0 would render a real $0.00.
 */
function decimalToMinorUnits(decimal: string | null | undefined): number | null {
  if (decimal === null || decimal === undefined || decimal === '') return null
  const parsed = Number.parseFloat(String(decimal))
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null
}

/** Project one REST order into a SOURCE-shaped record (fields keyed by sourcePath). */
function toOrderRecord(o: RawOrder): ConnectorRecord {
  const fulfilled = deriveFulfillments(o)
  return {
    streamKey: 'order',
    externalId: String(o.id),
    displayName: o.name ?? `#${o.order_number ?? o.id}`,
    fields: {
      id: String(o.id),
      name: o.name,
      email: o.email,
      currency: o.currency,
      total_price: decimalToMinorUnits(o.total_price),
      subtotal_price: decimalToMinorUnits(o.subtotal_price),
      total_tax: decimalToMinorUnits(o.total_tax),
      total_discounts: decimalToMinorUnits(o.total_discounts),
      financial_status: o.financial_status,
      fulfillment_status: fulfillmentStatus(o.fulfillment_status),
      // Only set on a cancelled order — leave null otherwise (no enum value to write).
      cancel_reason: o.cancel_reason,
      // Joined to a COMMA STRING, never emitted as an array: the fan-out drops
      // array-shaped source values outright. `''` (not null) for an order with no
      // gateway — a $0 / fully-discounted order is legitimately empty, not unknown.
      payment_gateway_names: (o.payment_gateway_names ?? []).join(','),
      tags: toTagString(o.tags),
      note: o.note,
      created_at: o.created_at,
      processed_at: o.processed_at,
      cancelled_at: o.cancelled_at,
      // Synthesised rollup of fulfillments[] — no such object exists in Shopify's
      // payload. Namespaced under `derived` so it reads as computed rather than raw,
      // and so it can never collide with a future real Shopify field.
      derived: fulfilled.order,
      shipping_address: toAddressStruct(o.shipping_address),
      billing_address: toAddressStruct(o.billing_address),
      customer: o.customer
        ? {
            // `id` keys the contributing contact item to the same external id the
            // `customer` stream emits, so the order→contact `Customer` edge resolves.
            id: o.customer.id != null ? String(o.customer.id) : null,
            email: o.customer.email,
            first_name: o.customer.first_name,
            last_name: o.customer.last_name,
          }
        : null,
      // Raw array — the platform fans each element out per the `line_items[]` mapping.
      // `product_id` is stringified to match the product stream's `externalId` so the
      // line→product reference links.
      line_items: (o.line_items ?? []).map((li) => ({
        // The line item's own Shopify id — its declared External ID (`lineItems.shopifyId`),
        // a stable per-line identity that replaces the positional `{orderId}:{index}` fallback.
        id: li.id != null ? String(li.id) : null,
        title: li.title,
        variant_title: li.variant_title,
        // Stringified to match the product stream's variant External ID so the
        // line→variant reference edge resolves (same discipline as product_id).
        variant_id: li.variant_id != null ? String(li.variant_id) : null,
        sku: li.sku,
        vendor: li.vendor,
        quantity: typeof li.quantity === 'number' ? li.quantity : null,
        fulfillable_quantity:
          typeof li.fulfillable_quantity === 'number' ? li.fulfillable_quantity : null,
        price: decimalToMinorUnits(li.price),
        // The order's currency, carried onto every line. Line items fan out into
        // their own def, and Shopify's line payload has no currency of its own —
        // so without this the money lands on a record that cannot say what it is.
        // Same synthesis discipline as `derived`.
        currency: o.currency,
        fulfillment_status: fulfillmentStatus(li.fulfillment_status),
        product_id: li.product_id != null ? String(li.product_id) : null,
        // Per-line shipment rollup. A line never touched by a live fulfillment gets an
        // explicit zeroed shape rather than a missing key, so the columns read as
        // "nothing shipped" instead of "not synced".
        derived: (li.id != null ? fulfilled.byLineId.get(String(li.id)) : null) ?? {
          fulfilled_at: null,
          last_fulfilled_at: null,
          fulfilled_quantity: 0,
          shipment_count: 0,
          tracking_number: null,
        },
      })),
    },
  }
}

// ── product stream ─────────────────────────────────────────────────────────────

/**
 * An embedded Shopify REST product variant (from /products.json `variants[]`).
 * `id`/`inventory_item_id` arrive as numbers; both are stringified in projection so
 * the External-ID and webhook join-key comparisons stay string-based (like line items).
 */
interface RawVariant {
  id: number | null
  sku: string | null
  title: string | null
  price: string | null
  inventory_quantity: number | null
  inventory_item_id: number | null
  position: number | null
  option1: string | null
  option2: string | null
  option3: string | null
  updated_at: string
}

interface RawProduct {
  id: number
  title: string | null
  body_html: string | null
  vendor: string | null
  product_type: string | null
  handle: string | null
  status: string | null
  tags: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  variants?: RawVariant[] | null
}

/**
 * Product-qualified variant title, projected INTO `variants[].title` (the
 * shopify_variants primaryDisplayField) so variant records are tellable apart in
 * pickers. Shopify's raw variant title is ALL present option values joined with
 * " / " ("Grey / 42 / Wool") — and the literal "Default Title" for single-variant
 * products, which would otherwise name every such record identically. Note this
 * diverges from the raw Shopify value the order stream's `lineItems.variantTitle`
 * carries; variant identity/joins use `variants.id` / `inventory_item_id`, never
 * the title.
 */
function variantDisplayTitle(p: RawProduct, v: RawVariant): string {
  const productTitle = p.title ?? String(p.id)
  // Prefer Shopify's pre-joined title; re-join option1–3 ourselves if it's absent.
  // "Default Title" is the placeholder option value on no-option products — never a
  // real option — so it's dropped from the join and caught below when it IS the title.
  const optionsTitle =
    v.title ??
    [v.option1, v.option2, v.option3].filter((o) => o && o !== 'Default Title').join(' / ')
  if (!optionsTitle || optionsTitle === 'Default Title') return productTitle
  return `${productTitle} - ${optionsTitle}`
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
      body_html: p.body_html,
      vendor: p.vendor,
      product_type: p.product_type,
      handle: p.handle,
      status: p.status,
      tags: toTagString(p.tags),
      created_at: p.created_at,
      published_at: p.published_at,
      updated_at: p.updated_at,
      // Raw array — the platform fans each element out per the `variants[]` mapping
      // into the owned shopify_variants def. `id` is the variant's External ID and
      // `inventory_item_id` the webhook join key; both stringified (they arrive as
      // numbers, comparisons are string-based) — same discipline as the line-item fan-out.
      variants: (p.variants ?? []).map((v) => ({
        id: v.id != null ? String(v.id) : null,
        sku: v.sku,
        title: variantDisplayTitle(p, v),
        price: decimalToMinorUnits(v.price),
        inventory_quantity: typeof v.inventory_quantity === 'number' ? v.inventory_quantity : null,
        inventory_item_id: v.inventory_item_id != null ? String(v.inventory_item_id) : null,
        position: typeof v.position === 'number' ? v.position : null,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
      })),
    },
  }
}

// ── webhook-steered product fetch ────────────────────────────────────────────────

/**
 * Steered partial fetch for an `inventory_levels/update` delivery. The webhook
 * payload carries the `inventory_item_id` (NOT a variant/product id), so resolve
 * inventory item → variant → product via one GraphQL lookup, then re-fetch that ONE
 * product through the same REST projection the crawl uses — the `variants[]` fan-out
 * refreshes every sibling variant's quantity in the same page. Single page, no
 * cursor: `backfillComplete` terminates the platform's pagination loop immediately.
 */
async function fetchSteeredProduct(
  args: ConnectorExecuteArgs,
  inventoryItemId: string
): Promise<ConnectorFetchResult> {
  const { connection } = args
  const token = getShopifyToken(connection)
  if (!token) {
    throw new Error('shopify: missing connection (requiresConnection)')
  }
  const shopDomain = getShopDomain(connection?.metadata)
  if (!shopDomain) {
    throw new Error('shopify: connection metadata is missing the shop domain')
  }
  const headers = {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json',
  }

  // inventory_item_id → owning product id. GraphQL is the only join Shopify offers
  // (REST has no inventory-item → variant lookup without scanning).
  const gqlRes = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query:
        'query($id: ID!) { inventoryItem(id: $id) { variant { product { legacyResourceId } } } }',
      variables: { id: `gid://shopify/InventoryItem/${inventoryItemId}` },
    }),
  })
  if (!gqlRes.ok) {
    throw new Error(`shopify: GraphQL inventoryItem lookup responded ${gqlRes.status}`)
  }
  const gql = (await gqlRes.json()) as {
    data?: { inventoryItem?: { variant?: { product?: { legacyResourceId?: string } } } | null }
  }
  const productId = gql.data?.inventoryItem?.variant?.product?.legacyResourceId
  if (!productId) {
    // Item deleted/detached between the delivery and this fetch — nothing to refresh.
    return { records: [], nextState: { backfillComplete: true } }
  }

  const res = await fetch(
    `https://${shopDomain}/admin/api/${API_VERSION}/products/${productId}.json`,
    { headers }
  )
  if (res.status === 404) {
    return { records: [], nextState: { backfillComplete: true } }
  }
  if (!res.ok) {
    throw new Error(`shopify: Admin API responded ${res.status} for products/${productId}`)
  }
  const { product } = (await res.json()) as { product: RawProduct }
  return { records: [toProductRecord(product)], nextState: { backfillComplete: true } }
}

export default async function shopifySync(
  args: ConnectorExecuteArgs
): Promise<ConnectorFetchResult> {
  // Webhook-steered partial fetch (inventory_levels/update → product stream): the
  // platform passes the delivery's declared paths as triggerContext — fetch ONLY the
  // affected product instead of crawling the collection.
  if (args.streamKey === 'product' && args.triggerContext?.resourceId) {
    return fetchSteeredProduct(args, args.triggerContext.resourceId)
  }
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
