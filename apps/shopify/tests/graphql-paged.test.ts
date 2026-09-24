// apps/shopify/tests/graphql-paged.test.ts

import type { ConnectorExecuteArgs } from '@auxx/sdk/data-connectors'
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

function sync(state: ConnectorExecuteArgs['state'], extraQuery?: string[]) {
  return fetchGraphqlPage<Data, Node, { id: string; updated_at: string }>(
    {
      streamKey: 'thing',
      mode: 'incremental',
      state,
      config: {},
      connection,
    },
    {
      query: 'query Q($first: Int!, $after: String, $query: String) { things }',
      first: 250,
      connection: (data) => data.things,
      toRaw: (n) => ({ id: n.legacyResourceId, updated_at: n.updatedAt }),
      toRecord: (raw) => ({ streamKey: 'thing', externalId: raw.id, fields: {} }),
      extraQuery,
    },
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchGraphqlPage', () => {
  it('drops a legacy REST page_info cursor and restarts from updatedSince', async () => {
    const calls = stubGraphql([page([node('1', '2026-09-01T00:00:00Z')], 'c1')])
    await sync({ cursor: 'eyJsYXN0X2lkIjo0fQ', updatedSince: '2026-08-01T00:00:00Z' })
    expect(calls[0]!.body.variables).toEqual({
      first: 250,
      after: null,
      query: "updated_at:>='2026-08-01T00:00:00.000Z'",
    })
  })

  it('passes a v3 cursor as after and re-sends the query on page 2', async () => {
    const calls = stubGraphql([page([node('2', '2026-09-02T00:00:00Z')], 'c2')])
    await sync({ cursor: { v: 3, after: 'c1' }, updatedSince: '2026-08-01T00:00:00Z' })
    expect(calls[0]!.body.variables).toEqual({
      first: 250,
      after: 'c1',
      query: "updated_at:>='2026-08-01T00:00:00.000Z'",
    })
  })

  it('normalises a shop-local REST watermark to UTC and rejects garbage', () => {
    const state = { updatedSince: '2026-08-01T10:00:00-07:00' }
    expect(searchQuery({ mode: 'incremental', state })).toBe(
      "updated_at:>='2026-08-01T17:00:00.000Z'",
    )
    expect(() => searchQuery({ mode: 'incremental', state: { updatedSince: 'nope' } })).toThrow()
    expect(searchQuery({ mode: 'snapshot', state })).toBeNull()
    expect(searchQuery({ mode: 'incremental', state: {} }, ['a:1', 'b:2'])).toBe('a:1 AND b:2')
  })

  it('appends extra query terms after the watermark', async () => {
    const calls = stubGraphql([page([], null)])
    await sync({ updatedSince: '2026-08-01T00:00:00Z' }, ['orders_count:>0'])
    expect(calls[0]!.body.variables.query).toBe(
      "updated_at:>='2026-08-01T00:00:00.000Z' AND orders_count:>0",
    )
  })

  it('holds the watermark mid-chain and advances it on the last page', async () => {
    stubGraphql([
      page([node('1', '2026-09-01T00:00:00Z'), node('2', '2026-09-03T00:00:00Z')], 'c1'),
      page([node('3', '2026-09-05T00:00:00Z'), node('4', '2026-09-04T00:00:00Z')], null),
    ])
    const first = await sync({ updatedSince: '2026-08-01T00:00:00Z' })
    expect(first.records).toHaveLength(2)
    expect(first.nextState).toEqual({
      cursor: { v: 3, after: 'c1' },
      updatedSince: '2026-08-01T00:00:00Z',
    })
    const last = await sync(first.nextState)
    expect(last.nextState).toEqual({
      cursor: undefined,
      updatedSince: '2026-09-05T00:00:00Z',
      backfillComplete: true,
    })
  })

  it('keeps the cursor and watermark on a throttle', async () => {
    stubGraphql([{ status: 429, headers: { 'Retry-After': '3' } }])
    const state = { cursor: { v: 3, after: 'c1' }, updatedSince: '2026-08-01T00:00:00Z' }
    await expect(sync(state)).resolves.toEqual({
      records: [],
      nextState: state,
      rateLimited: { retryAfterMs: 3000 },
    })
  })

  it('throws when a next page is announced without a cursor', async () => {
    stubGraphql([page([], null, true)])
    await expect(sync({})).rejects.toThrow('no cursor')
  })
})
