// src/graphql/paged.ts

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorQuery,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { type GraphqlPage, type ShopifyHttp, shopifyGraphql, shopifyHttp } from './client'

/**
 * The page cursor of a GraphQL-paged stream (plan §6.1). v3 is an ascending crawl; v4 is a
 * newest-first crawl carrying `t0`, the `since` it resumes from (history-window §3.3).
 */
export type GraphqlCursor = { v: 3; after: string } | { v: 4; after: string; t0: string }

/** The `{ nodes, pageInfo }` half of a GraphQL connection. */
export interface GraphqlConnection<Node> {
  nodes: Node[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}

/** A v3 or v4 cursor, or undefined for anything else (a REST `page_info` string). */
export function readGraphqlCursor(cursor: unknown): GraphqlCursor | undefined {
  if (typeof cursor !== 'object' || cursor === null) return undefined
  const { v, after, t0 } = cursor as { v?: unknown; after?: unknown; t0?: unknown }
  if (typeof after !== 'string' || !after) return undefined
  if (v === 3) return { v: 3, after }
  if (v === 4 && typeof t0 === 'string' && !Number.isNaN(Date.parse(t0))) return { v: 4, after, t0 }
  return undefined
}

/** Clock-skew margin between our clock (T0) and Shopify's `updated_at`. */
export const T0_MARGIN_MS = 5 * 60 * 1000

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
 * every page since cursors don't carry it. `periodField` is the search field of the stream's
 * declared `period`.
 */
export function searchQuery(query: ConnectorQuery, periodField = 'created_at'): string | null {
  const terms: string[] = []
  if (query.ids) {
    // Digits only, so nothing injects; a GID is rejected by Shopify's `id:` search.
    if (query.ids.length === 0 || !query.ids.every((id) => /^\d+$/.test(id))) {
      throw new Error(`shopify: ids must be numeric legacy ids, got ${JSON.stringify(query.ids)}`)
    }
    terms.push(`(${query.ids.map((id) => `id:${id}`).join(' OR ')})`)
  }
  if (query.period?.from) terms.push(isoTerm(periodField, '>=', query.period.from))
  if (query.period?.to) terms.push(isoTerm(periodField, '<', query.period.to))
  // `>=`, not `>`: timestamps are to the second, so a strict bound could skip a record
  // updated in the same second after the previous run read it. The overlap re-upserts.
  if (query.since !== undefined) terms.push(isoTerm('updated_at', '>=', query.since))
  return terms.length ? terms.join(' AND ') : null
}

/** How a `since` stream sorts; its page query declares `$sortKey` and `$reverse: Boolean`. */
export interface SinceSort {
  /** Sort key of a since-less fetch, crawled newest first (`reverse: true`). */
  newestFirst: string
  /** Sort key of a delta (`query.since` set) and of a v3 crawl, ascending. */
  ascending: string
}

/**
 * Fetch ONE page of a GraphQL connection for `args.query` and project it. `query` must
 * declare `$first: Int!, $after: String, $query: String`. A `since` stream crawls a since-less
 * query newest first and returns `since: t0` on every page (history-window §3.3); a delta or a
 * v3 crawl runs ascending and returns `maxUpdatedAt` on its last page.
 */
export async function fetchGraphqlPage<Data, Node, Raw extends { updated_at: string }>(
  args: ConnectorExecuteArgs,
  opts: {
    query: string
    first: number
    connection: (data: Data) => GraphqlConnection<Node>
    toRaw: (node: Node) => Raw
    toRecord: (raw: Raw) => ConnectorRecord
    /** The stream declares `query.since`. */
    since?: SinceSort
    /** Search field of the stream's declared `period`; defaults to `created_at`. */
    periodField?: string
    /** Per-page follow-ups before `toRaw` (e.g. nested paging); a throttle retries the page. */
    complete?: (nodes: Node[], http: ShopifyHttp) => Promise<GraphqlPage<Node[]>>
  }
): Promise<ConnectorFetchResult> {
  const search = searchQuery(args.query, opts.periodField)
  const http = shopifyHttp(args.connection)
  const incoming = readGraphqlCursor(args.cursor)
  // Restarting a newest-first crawl would take a fresh t0 while the platform's history limit
  // still counts the first crawl's records, so a capped stop could skip edits.
  if (opts.since && args.query.since === undefined && args.cursor != null && !incoming) {
    throw new Error('shopify: unreadable page cursor on a newest-first crawl; re-sync the stream')
  }
  // A cursor-less since-less fetch starts a v4 crawl; a cursor finishes the crawl it belongs to.
  const t0 =
    incoming?.v === 4
      ? incoming.t0
      : opts.since && !incoming && args.query.since === undefined
        ? new Date(Date.now() - T0_MARGIN_MS).toISOString()
        : undefined

  const variables: Record<string, unknown> = {
    first: opts.first,
    after: incoming?.after ?? null,
    query: search,
  }
  if (opts.since) {
    variables.sortKey = t0 ? opts.since.newestFirst : opts.since.ascending
    variables.reverse = !!t0
  }
  const res = await shopifyGraphql<Data>(http, opts.query, variables)
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
    const after = pageInfo.endCursor
    if (t0) return { records, cursor: { v: 4, after, t0 } satisfies GraphqlCursor, since: t0 }
    return { records, cursor: { v: 3, after } satisfies GraphqlCursor }
  }
  if (t0) return { records, since: t0 }
  return opts.since ? { records, since: maxUpdatedAt(rows, args.query.since) } : { records }
}
