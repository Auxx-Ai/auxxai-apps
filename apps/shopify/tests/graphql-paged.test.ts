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

const SORT = { newestFirst: 'CREATED_AT', ascending: 'UPDATED_AT' }
const NOW = '2026-09-28T12:00:00Z'
const T0 = '2026-09-28T11:55:00.000Z'

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
      since: since ? SORT : undefined,
    }
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

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

  it("bounds the period on the stream's own field", () => {
    expect(searchQuery({ period: { from: '2026-01-01T00:00:00Z' } }, 'updated_at')).toBe(
      "updated_at:>='2026-01-01T00:00:00.000Z'"
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
      sortKey: 'UPDATED_AT',
      reverse: false,
    })
  })

  it('passes a v3 cursor as after and re-sends the query on page 2', async () => {
    const calls = stubGraphql([page([node('2', '2026-09-02T00:00:00Z')], 'c2')])
    await sync({ since: '2026-08-01T00:00:00Z' }, { v: 3, after: 'c1' })
    expect(calls[0]!.body.variables).toEqual({
      first: 250,
      after: 'c1',
      query: "updated_at:>='2026-08-01T00:00:00.000Z'",
      sortKey: 'UPDATED_AT',
      reverse: false,
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

  it('returns no since from a stream that does not declare one, and sends no sort', async () => {
    const calls = stubGraphql([
      page([node('1', '2026-09-01T00:00:00Z')], 'c1'),
      page([node('2', '2026-09-01T00:00:00Z')], null),
    ])
    const first = await sync({}, undefined, false)
    expect(first).toMatchObject({ cursor: { v: 3, after: 'c1' } })
    expect(first.since).toBeUndefined()
    const last = await sync({}, first.cursor, false)
    expect(last.since).toBeUndefined()
    expect(last.cursor).toBeUndefined()
    expect(calls[0]!.body.variables).toEqual({ first: 250, after: null, query: null })
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

describe('fetchGraphqlPage newest-first crawl (history-window §3.3)', () => {
  it('sends reverse on a cursor-less since-less page and returns a v4 cursor carrying t0', async () => {
    vi.useFakeTimers({ now: new Date(NOW), toFake: ['Date'] })
    const calls = stubGraphql([page([node('9', '2026-09-27T00:00:00Z')], 'c1')])
    const result = await sync({ period: { from: '2026-01-01T00:00:00Z' } })
    expect(calls[0]!.body.variables).toEqual({
      first: 250,
      after: null,
      query: "created_at:>='2026-01-01T00:00:00.000Z'",
      sortKey: 'CREATED_AT',
      reverse: true,
    })
    expect(result.cursor).toEqual({ v: 4, after: 'c1', t0: T0 })
    expect(result.since).toBe(T0)
  })

  it('carries t0 forward and returns it as since on every page and the terminal page', async () => {
    vi.useFakeTimers({ now: new Date(NOW), toFake: ['Date'] })
    const calls = stubGraphql([
      page([node('9', '2026-09-27T00:00:00Z')], 'c1'),
      page([node('8', '2026-09-20T00:00:00Z')], 'c2'),
      page([node('7', '2026-01-02T00:00:00Z')], null),
    ])
    const first = await sync({})
    // The clock moves on; t0 must not.
    vi.setSystemTime(new Date('2026-09-29T00:00:00Z'))
    const second = await sync({}, first.cursor)
    const last = await sync({}, second.cursor)
    expect(second).toMatchObject({ cursor: { v: 4, after: 'c2', t0: T0 }, since: T0 })
    expect(last.cursor).toBeUndefined()
    expect(last.since).toBe(T0)
    expect(calls[1]!.body.variables).toMatchObject({ after: 'c1', reverse: true })
    expect(calls[2]!.body.variables).toMatchObject({ after: 'c2', reverse: true })
  })

  it('returns t0 from an empty cursor-less backfill', async () => {
    vi.useFakeTimers({ now: new Date(NOW), toFake: ['Date'] })
    stubGraphql([page([], null)])
    await expect(sync({})).resolves.toEqual({ records: [], since: T0 })
  })

  it('continues a v3 cursor ascending and ends with maxUpdatedAt', async () => {
    const calls = stubGraphql([
      page([node('3', '2026-09-05T00:00:00Z'), node('4', '2026-09-04T00:00:00Z')], null),
    ])
    const last = await sync({}, { v: 3, after: 'c1' })
    expect(calls[0]!.body.variables).toMatchObject({
      after: 'c1',
      sortKey: 'UPDATED_AT',
      reverse: false,
    })
    expect(last).toMatchObject({ since: '2026-09-05T00:00:00Z' })
    expect(last.cursor).toBeUndefined()
  })

  it('runs a delta (query.since set) ascending with v3 cursors and ends with maxUpdatedAt', async () => {
    const calls = stubGraphql([
      page([node('1', '2026-09-02T00:00:00Z')], 'c1'),
      page([node('2', '2026-09-03T00:00:00Z')], null),
    ])
    const query = { since: '2026-09-01T00:00:00Z' }
    const first = await sync(query)
    const last = await sync(query, first.cursor)
    expect(calls[0]!.body.variables).toMatchObject({ sortKey: 'UPDATED_AT', reverse: false })
    expect(first.cursor).toEqual({ v: 3, after: 'c1' })
    expect(first.since).toBeUndefined()
    expect(last.since).toBe('2026-09-03T00:00:00Z')
  })

  it('does not lose an edit made mid-crawl to a record already read (§3.2 #2)', async () => {
    // Orders sorted by created_at desc: A (newer) is read on page 1, then edited; B (older)
    // is edited later still and read on page 2. Neither moves in the sort.
    vi.useFakeTimers({ now: new Date('2026-09-28T12:00:00Z'), toFake: ['Date'] })
    const aEditedAt = '2026-09-28T12:10:00Z'
    const bEditedAt = '2026-09-28T12:20:00Z'
    stubGraphql([
      page([node('A', '2026-09-01T00:00:00Z')], 'c1'),
      page([node('B', bEditedAt)], null),
    ])
    const first = await sync({})
    vi.setSystemTime(new Date('2026-09-28T12:30:00Z'))
    const last = await sync({}, first.cursor)

    // The first delta is built from the returned since.
    const delta = searchQuery({ since: last.since })!
    const bound = /updated_at:>='([^']+)'/.exec(delta)![1]!
    const deltaReads = (updatedAt: string) => Date.parse(updatedAt) >= Date.parse(bound)
    expect(deltaReads(aEditedAt)).toBe(true)
    expect(deltaReads(bEditedAt)).toBe(true)
    // A running max over what was read would have skipped A's edit.
    expect(Date.parse(aEditedAt) >= Date.parse(bEditedAt)).toBe(false)
  })

  it('fails a newest-first crawl on an unreadable cursor instead of restarting it', async () => {
    const calls = stubGraphql([page([], null)])
    await expect(sync({}, { v: 4, after: 'c1', t0: 'nope' })).rejects.toThrow(/unreadable/)
    await expect(sync({}, 'eyJsYXN0X2lkIjo0fQ')).rejects.toThrow(/unreadable/)
    expect(calls).toHaveLength(0)
  })

  it('still restarts a stream without since on an unreadable cursor', async () => {
    const calls = stubGraphql([page([], null)])
    await sync({}, 'eyJsYXN0X2lkIjo0fQ', false)
    expect(calls[0]!.body.variables).toMatchObject({ after: null })
  })
})
