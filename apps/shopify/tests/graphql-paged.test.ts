// apps/shopify/tests/graphql-paged.test.ts

import type { ConnectorQuery } from '@auxx/sdk/data-connectors'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchGraphqlPage, type GraphqlConnection, searchQuery } from '../src/graphql/paged'
import { connection, stubGraphql } from './graphql-test-support'

interface Node {
  legacyResourceId: string
  updatedAt: string
}
interface Data {
  things: GraphqlConnection<Node>
}

const node = (id: string, updatedAt: string): Node => ({ legacyResourceId: id, updatedAt })
const page = (nodes: Node[], endCursor: string | null, hasNextPage = endCursor !== null) => ({
  body: { data: { things: { nodes, pageInfo: { hasNextPage, endCursor } } } },
})

function sync(query: ConnectorQuery, cursor?: unknown, since = true) {
  return fetchGraphqlPage<Data, Node, { id: string; updated_at: string }>(
    { streamKey: 'thing', query, cursor, config: {}, connection },
    {
      query: 'query Q($first: Int!, $after: String, $query: String) { things }',
      first: 250,
      connection: (data) => data.things,
      toRaw: (n) => ({ id: n.legacyResourceId, updated_at: n.updatedAt }),
      toRecord: (raw) => ({
        streamKey: 'thing',
        externalId: raw.id,
        displayName: raw.id,
        fields: {},
      }),
      since,
    }
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('searchQuery', () => {
  it('is null for an unbounded query', () => {
    expect(searchQuery({})).toBeNull()
  })

  it('composes ids, period and since, ANDed', () => {
    expect(
      searchQuery({
        ids: ['1', '2'],
        period: { from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' },
        since: '2026-08-01T10:00:00-07:00',
      })
    ).toBe(
      "(id:1 OR id:2) AND created_at:>='2026-01-01T00:00:00.000Z' AND " +
        "created_at:<'2026-02-01T00:00:00.000Z' AND updated_at:>='2026-08-01T17:00:00.000Z'"
    )
  })

  it('sends one bound of a half-open period alone', () => {
    expect(searchQuery({ period: { from: '2026-01-01T00:00:00Z' } })).toBe(
      "created_at:>='2026-01-01T00:00:00.000Z'"
    )
  })

  it('refuses ids that are not numeric legacy ids, and an unreadable since', () => {
    expect(() => searchQuery({ ids: ['gid://shopify/Order/1'] })).toThrow(/numeric/)
    expect(() => searchQuery({ ids: ['1) OR (id:2'] })).toThrow(/numeric/)
    expect(() => searchQuery({ ids: [] })).toThrow(/numeric/)
    expect(() => searchQuery({ since: 'nope' })).toThrow(/unparseable/)
    expect(() => searchQuery({ since: { historyId: 1 } })).toThrow(/unparseable/)
  })
})

describe('fetchGraphqlPage', () => {
  it('drops a legacy REST page_info cursor and restarts the query', async () => {
    const calls = stubGraphql([page([node('1', '2026-09-01T00:00:00Z')], 'c1')])
    await sync({ since: '2026-08-01T00:00:00Z' }, 'eyJsYXN0X2lkIjo0fQ')
    expect(calls[0]!.body.variables).toEqual({
      first: 250,
      after: null,
      query: "updated_at:>='2026-08-01T00:00:00.000Z'",
    })
  })

  it('passes a v3 cursor as after and re-sends the query on page 2', async () => {
    const calls = stubGraphql([page([node('2', '2026-09-02T00:00:00Z')], 'c2')])
    await sync({ since: '2026-08-01T00:00:00Z' }, { v: 3, after: 'c1' })
    expect(calls[0]!.body.variables).toEqual({
      first: 250,
      after: 'c1',
      query: "updated_at:>='2026-08-01T00:00:00.000Z'",
    })
  })

  it('returns a cursor mid-chain and since only on the last page', async () => {
    stubGraphql([
      page([node('1', '2026-09-01T00:00:00Z'), node('2', '2026-09-03T00:00:00Z')], 'c1'),
      page([node('3', '2026-09-05T00:00:00Z'), node('4', '2026-09-04T00:00:00Z')], null),
    ])
    const query = { since: '2026-08-01T00:00:00Z' }
    const first = await sync(query)
    expect(first.records).toHaveLength(2)
    expect(first.cursor).toEqual({ v: 3, after: 'c1' })
    expect(first.since).toBeUndefined()
    const last = await sync(query, first.cursor)
    expect(last.cursor).toBeUndefined()
    expect(last.since).toBe('2026-09-05T00:00:00Z')
  })

  it('keeps the incoming since when the last page is empty', async () => {
    stubGraphql([page([], null)])
    const result = await sync({ since: '2026-08-01T00:00:00Z' })
    expect(result).toEqual({ records: [], since: '2026-08-01T00:00:00Z' })
  })

  it('returns no since from a stream that does not declare one', async () => {
    stubGraphql([page([node('1', '2026-09-01T00:00:00Z')], null)])
    const result = await sync({}, undefined, false)
    expect(result.since).toBeUndefined()
    expect(result.cursor).toBeUndefined()
  })

  it('returns rateLimited with no cursor or since on a throttle', async () => {
    stubGraphql([{ status: 429, headers: { 'Retry-After': '3' } }])
    await expect(sync({ since: '2026-08-01T00:00:00Z' }, { v: 3, after: 'c1' })).resolves.toEqual({
      records: [],
      rateLimited: { retryAfterMs: 3000 },
    })
  })

  it('throws when a next page is announced without a cursor', async () => {
    stubGraphql([page([], null, true)])
    await expect(sync({})).rejects.toThrow('no cursor')
  })
})
