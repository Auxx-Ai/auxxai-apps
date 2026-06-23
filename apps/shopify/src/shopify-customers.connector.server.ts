// src/shopify-customers.connector.server.ts
//
// Server handler for the Shopify Customers connector. Runs inside the app-runtime
// sandbox: fetches ONE page of customers from the REST /customers.json endpoint
// using the bound connection, and returns the page's records + a flat cursor. The
// platform (Step 11 adapter) wraps that cursor into a resume checkpoint and
// re-invokes for the next page until `backfillComplete`.
//
// Why raw `fetch` (not the shared shopifyApi helpers): `shopifyApi` returns parsed
// JSON with no headers and `shopifyApiGetAll` auto-drains every page — neither
// fits the "one page + next cursor" contract the connector needs. The pure
// `getShopDomain(metadata)` helper IS reusable.
//
// Connection contract: a connector resolves its connection from `args.connection`
// (NOT the ambient tool/agent `getConnection()` helper) — `value` is the Admin API
// access token, `metadata` carries the shop domain.

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { getShopDomain } from './blocks/shopify/shared/shopify-api'

const API_VERSION = '2024-10'
const PAGE_SIZE = 250

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
function toRecord(c: RawCustomer): ConnectorRecord {
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

/** Extract the `page_info` token of the `rel="next"` link from a Link header. */
function nextPageInfo(linkHeader: string | null): string | undefined {
  return linkHeader?.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/)?.[1]
}

export default async function shopifyCustomersSync(
  args: ConnectorExecuteArgs
): Promise<ConnectorFetchResult> {
  const { streamKey, mode, state, connection } = args

  if (streamKey !== 'customer') {
    throw new Error(`shopify.customers: unknown stream "${streamKey}"`)
  }
  if (!connection?.value) {
    throw new Error('shopify.customers: missing connection (requiresConnection)')
  }
  const token = connection.value
  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) {
    throw new Error('shopify.customers: connection metadata is missing the shop domain')
  }

  // page_info (the flat cursor) wins when present. Shopify forbids any other
  // filter once page_info is set (the token encodes them), so `updated_at_min`
  // rides page 1 only.
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (state.cursor) {
    params.set('page_info', String(state.cursor))
  } else if (mode === 'incremental' && state.updatedSince) {
    params.set('updated_at_min', String(state.updatedSince))
  }

  const res = await fetch(
    `https://${shopDomain}/admin/api/${API_VERSION}/customers.json?${params}`,
    { headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' } }
  )
  if (!res.ok) {
    throw new Error(`shopify.customers: Admin API responded ${res.status}`)
  }

  const customers = ((await res.json()) as { customers?: RawCustomer[] }).customers ?? []
  const next = nextPageInfo(res.headers.get('Link'))
  // High-water mark of `updated_at` so the next incremental run resumes from it.
  const lastUpdated = customers[customers.length - 1]?.updated_at ?? state.updatedSince

  return {
    records: customers.map(toRecord),
    nextState: next
      ? // More pages in this chain — keep the page cursor, hold the watermark.
        { cursor: next, updatedSince: state.updatedSince }
      : // Chain done — drop the cursor, advance the watermark for the next run.
        { cursor: undefined, updatedSince: lastUpdated, backfillComplete: true },
  }
}
