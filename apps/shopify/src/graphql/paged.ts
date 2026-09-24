// src/graphql/paged.ts

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { type GraphqlPage, type ShopifyHttp, shopifyGraphql, shopifyHttp } from './client'

/** `state.cursor` of a GraphQL-paged stream (plan §6.1). */
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
  fallback: unknown,
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

/** The `query:` search string, re-sent identically on every page since cursors don't carry it. */
export function searchQuery(
  args: Pick<ConnectorExecuteArgs, 'mode' | 'state'>,
  extraQuery: string[] = [],
): string | null {
  const terms: string[] = []
  const since = args.state.updatedSince
  if (args.mode === 'incremental' && since) {
    const ms = Date.parse(String(since))
    if (Number.isNaN(ms)) throw new Error(`shopify: unparseable updatedSince "${since}"`)
    // Normalise REST-era shop-local offsets to UTC for the search syntax.
    terms.push(`updated_at:>='${new Date(ms).toISOString()}'`)
  }
  terms.push(...extraQuery)
  return terms.length ? terms.join(' AND ') : null
}

/**
 * Fetch ONE page of a GraphQL connection and project it. `query` must declare
 * `$first: Int!, $after: String, $query: String`. The watermark is held for the chain
 * and advances to `maxUpdatedAt` only on the last page.
 */
export async function fetchGraphqlPage<Data, Node, Raw extends { updated_at: string }>(
  args: ConnectorExecuteArgs,
  opts: {
    query: string
    first: number
    connection: (data: Data) => GraphqlConnection<Node>
    toRaw: (node: Node) => Raw
    toRecord: (raw: Raw) => ConnectorRecord
    extraQuery?: string[]
    /** Per-page follow-ups before `toRaw` (e.g. nested paging); a throttle retries the page. */
    complete?: (nodes: Node[], http: ShopifyHttp) => Promise<GraphqlPage<Node[]>>
  },
): Promise<ConnectorFetchResult> {
  const { state } = args
  const http = shopifyHttp(args.connection)
  const cursor = readGraphqlCursor(state.cursor)

  const res = await shopifyGraphql<Data>(http, opts.query, {
    first: opts.first,
    after: cursor?.after ?? null,
    query: searchQuery(args, opts.extraQuery),
  })
  if (!res.ok) {
    return {
      records: [],
      nextState: { cursor: state.cursor, updatedSince: state.updatedSince },
      rateLimited: { retryAfterMs: res.retryAfterMs },
    }
  }

  const { nodes: pageNodes, pageInfo } = opts.connection(res.data)
  let nodes = pageNodes
  if (opts.complete) {
    const completed = await opts.complete(pageNodes, http)
    if (!completed.ok) {
      return {
        records: [],
        nextState: { cursor: state.cursor, updatedSince: state.updatedSince },
        rateLimited: { retryAfterMs: completed.retryAfterMs },
      }
    }
    nodes = completed.data
  }
  const rows = nodes.map(opts.toRaw)
  const records = rows.map(opts.toRecord)
  if (pageInfo.hasNextPage) {
    if (!pageInfo.endCursor) throw new Error('shopify: GraphQL page has a next page but no cursor')
    const next: GraphqlCursor = { v: 3, after: pageInfo.endCursor }
    return { records, nextState: { cursor: next, updatedSince: state.updatedSince } }
  }
  return {
    records,
    nextState: {
      cursor: undefined,
      updatedSince: maxUpdatedAt(rows, state.updatedSince),
      backfillComplete: true,
    },
  }
}
