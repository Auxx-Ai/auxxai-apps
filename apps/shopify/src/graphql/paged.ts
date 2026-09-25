// src/graphql/paged.ts

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorQuery,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { type GraphqlPage, type ShopifyHttp, shopifyGraphql, shopifyHttp } from './client'

/** The page cursor of a GraphQL-paged stream (plan §6.1). */
export interface GraphqlCursor {
  v: 3
  after: string
}

/** The `{ nodes, pageInfo }` half of a GraphQL connection. */
export interface GraphqlConnection<Node> {
  nodes: Node[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}

/** A v3 cursor, or undefined for anything else (a REST `page_info` string restarts the chain). */
export function readGraphqlCursor(cursor: unknown): GraphqlCursor | undefined {
  if (typeof cursor !== 'object' || cursor === null) return undefined
  const { v, after } = cursor as { v?: unknown; after?: unknown }
  return v === 3 && typeof after === 'string' && after ? { v: 3, after } : undefined
}

/**
 * Latest `updated_at` across a page, compared by epoch and returned as the original
 * ISO string. Falls back to `fallback` when the page is empty or holds no parseable
 * timestamp — never returns a value older than the mark we came in with.
 */
export function maxUpdatedAt<Raw extends { updated_at: string }>(
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

/** A query bound as a UTC ISO search value; quoted, since unquoted the ISO colon breaks parsing. */
function isoTerm(field: string, op: string, value: unknown): string {
  const ms = typeof value === 'string' ? Date.parse(value) : Number.NaN
  if (Number.isNaN(ms)) throw new Error(`shopify: unparseable ${field} bound "${String(value)}"`)
  return `${field}:${op}'${new Date(ms).toISOString()}'`
}

/**
 * The `query:` search string for a connector query, every term ANDed; re-sent identically on
 * every page since cursors don't carry it. Only the order stream declares `period`.
 */
export function searchQuery(query: ConnectorQuery): string | null {
  const terms: string[] = []
  if (query.ids) {
    // Digits only, so nothing injects; a GID is rejected by Shopify's `id:` search.
    if (query.ids.length === 0 || !query.ids.every((id) => /^\d+$/.test(id))) {
      throw new Error(`shopify: ids must be numeric legacy ids, got ${JSON.stringify(query.ids)}`)
    }
    terms.push(`(${query.ids.map((id) => `id:${id}`).join(' OR ')})`)
  }
  if (query.period?.from) terms.push(isoTerm('created_at', '>=', query.period.from))
  if (query.period?.to) terms.push(isoTerm('created_at', '<', query.period.to))
  // `>=`, not `>`: timestamps are to the second, so a strict bound could skip a record
  // updated in the same second after the previous run read it. The overlap re-upserts.
  if (query.since !== undefined) terms.push(isoTerm('updated_at', '>=', query.since))
  return terms.length ? terms.join(' AND ') : null
}

/**
 * Fetch ONE page of a GraphQL connection for `args.query` and project it. `query` must
 * declare `$first: Int!, $after: String, $query: String`. A `since` stream returns
 * `maxUpdatedAt` as `since` on its last page.
 */
export async function fetchGraphqlPage<Data, Node, Raw extends { updated_at: string }>(
  args: ConnectorExecuteArgs,
  opts: {
    query: string
    first: number
    connection: (data: Data) => GraphqlConnection<Node>
    toRaw: (node: Node) => Raw
    toRecord: (raw: Raw) => ConnectorRecord
    /** The stream declares `query.since`, so its last page returns one. */
    since?: boolean
    /** Per-page follow-ups before `toRaw` (e.g. nested paging); a throttle retries the page. */
    complete?: (nodes: Node[], http: ShopifyHttp) => Promise<GraphqlPage<Node[]>>
  }
): Promise<ConnectorFetchResult> {
  const search = searchQuery(args.query)
  const http = shopifyHttp(args.connection)
  const cursor = readGraphqlCursor(args.cursor)

  const res = await shopifyGraphql<Data>(http, opts.query, {
    first: opts.first,
    after: cursor?.after ?? null,
    query: search,
  })
  if (!res.ok) return { records: [], rateLimited: { retryAfterMs: res.retryAfterMs } }

  const { nodes: pageNodes, pageInfo } = opts.connection(res.data)
  let nodes = pageNodes
  if (opts.complete) {
    const completed = await opts.complete(pageNodes, http)
    if (!completed.ok) return { records: [], rateLimited: { retryAfterMs: completed.retryAfterMs } }
    nodes = completed.data
  }
  const rows = nodes.map(opts.toRaw)
  const records = rows.map(opts.toRecord)
  if (pageInfo.hasNextPage) {
    if (!pageInfo.endCursor) throw new Error('shopify: GraphQL page has a next page but no cursor')
    return { records, cursor: { v: 3, after: pageInfo.endCursor } satisfies GraphqlCursor }
  }
  return opts.since ? { records, since: maxUpdatedAt(rows, args.query.since) } : { records }
}
