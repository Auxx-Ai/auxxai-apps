// apps/shopify/tests/pushdown.test.ts

import type {
  ConnectorExecuteArgs,
  ConnectorRecordFilterCondition,
} from '@auxx/sdk/data-connectors'
import { UnpushableFilterError } from '@auxx/sdk/data-connectors'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CUSTOMER_PUSHDOWN,
  ORDER_PUSHDOWN,
  PRODUCT_PUSHDOWN,
  pushdownTerms,
} from '../src/graphql/pushdown'
import { shopifyConnector } from '../src/shopify.connector'
import shopifySync from '../src/shopify.connector.server'
import { connection, stubGraphql } from './graphql-test-support'

const between = ORDER_PUSHDOWN.createdAt!.between!
const idIn = ORDER_PUSHDOWN.$externalId!.in!

const august = {
  fieldId: 'createdAt',
  operator: 'between',
  value: { from: '2026-08-01T07:00:00.000Z', to: '2026-09-01T07:00:00.000Z' },
  exact: true,
}
const ids = (values: unknown[], exact = true): ConnectorRecordFilterCondition => ({
  fieldId: '$externalId',
  operator: 'in',
  value: values,
  exact,
})

const emptyPage = (key: string, endCursor: string | null = null) => ({
  body: {
    data: { [key]: { nodes: [], pageInfo: { hasNextPage: endCursor !== null, endCursor } } },
  },
})

function sync(
  streamKey: string,
  recordFilter: ConnectorRecordFilterCondition[],
  state: ConnectorExecuteArgs['state'] = {}
) {
  return shopifySync({
    streamKey,
    mode: 'incremental',
    state,
    config: {},
    connection,
    recordFilter,
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('order createdAt between', () => {
  it("quotes the engine's ISO bounds, from inclusive and to exclusive", () => {
    expect(between({ from: '2026-08-01T07:00:00.000Z', to: '2026-09-01T07:00:00.000Z' })).toBe(
      "created_at:>='2026-08-01T07:00:00.000Z' AND created_at:<'2026-09-01T07:00:00.000Z'"
    )
  })

  it('accepts a single bound', () => {
    expect(between({ from: '2026-08-01T07:00:00.000Z' })).toBe(
      "created_at:>='2026-08-01T07:00:00.000Z'"
    )
    expect(between({ to: '2026-09-01T07:00:00.000Z' })).toBe(
      "created_at:<'2026-09-01T07:00:00.000Z'"
    )
  })

  it('is undefined for a non-string bound or a non-object value', () => {
    expect(between({ from: Date.UTC(2026, 7, 1) })).toBeUndefined()
    expect(between({ from: '2026-08-01T07:00:00.000Z', to: {} })).toBeUndefined()
    expect(between('2026-08-01')).toBeUndefined()
    expect(between(null)).toBeUndefined()
  })
})

describe('$externalId in', () => {
  it('ORs legacy numeric ids', () => {
    expect(idIn(['1001', '1002'])).toBe('(id:1001 OR id:1002)')
    expect(CUSTOMER_PUSHDOWN.$externalId!.in!(['7'])).toBe('(id:7)')
    expect(PRODUCT_PUSHDOWN.$externalId!.in!(['8'])).toBe('(id:8)')
  })

  it('takes up to 50 ids', () => {
    const fifty = Array.from({ length: 50 }, (_, i) => String(i + 1))
    expect(idIn(fifty)).toMatch(/^\(id:1 OR .* OR id:50\)$/)
    expect(idIn([...fifty, '51'])).toBeUndefined()
    expect(idIn([])).toBeUndefined()
  })

  it('rejects GIDs and anything non-numeric', () => {
    expect(idIn(['gid://shopify/Order/1001'])).toBeUndefined()
    expect(idIn(['1001', 'abc'])).toBeUndefined()
    expect(idIn(['1001 OR id:1'])).toBeUndefined()
    expect(idIn('1001')).toBeUndefined()
    expect(idIn([1001])).toBeUndefined()
  })

  it('has no createdAt entry off the order stream', () => {
    expect(CUSTOMER_PUSHDOWN.createdAt).toBeUndefined()
    expect(PRODUCT_PUSHDOWN.createdAt).toBeUndefined()
  })
})

describe('pushdownTerms', () => {
  it('throws for an exact clause with no entry or an untranslatable value', () => {
    const noEntry = { fieldId: 'orders_count', operator: '>', value: 0, exact: true }
    expect(() => pushdownTerms('customer', CUSTOMER_PUSHDOWN, [noEntry])).toThrow(
      UnpushableFilterError
    )
    expect(() => pushdownTerms('order', ORDER_PUSHDOWN, [ids(['gid://shopify/Order/1'])])).toThrow(
      UnpushableFilterError
    )
  })

  it('skips a non-exact clause it cannot translate and pushes one it can', () => {
    const seed = { fieldId: 'orders_count', operator: '>', value: 0 }
    expect(pushdownTerms('customer', CUSTOMER_PUSHDOWN, [seed])).toEqual({
      terms: [],
      narrowed: false,
    })
    expect(pushdownTerms('customer', CUSTOMER_PUSHDOWN, [seed, ids(['7'], false)])).toEqual({
      terms: ['(id:7)'],
      narrowed: false,
    })
    expect(pushdownTerms('customer', CUSTOMER_PUSHDOWN, [seed, ids(['7'])])).toEqual({
      terms: ['(id:7)'],
      narrowed: true,
    })
  })
})

describe('narrowed fetches', () => {
  it('sends the delta and the createdAt terms on every order page, and marks them narrowed', async () => {
    const calls = stubGraphql([emptyPage('orders', 'c1'), emptyPage('orders')])
    const state = { updatedSince: '2026-08-15T00:00:00Z' }
    const first = await sync('order', [august], state)
    const last = await sync('order', [august], { ...state, cursor: first.nextState.cursor })
    const query =
      "updated_at:>='2026-08-15T00:00:00.000Z' AND created_at:>='2026-08-01T07:00:00.000Z'" +
      " AND created_at:<'2026-09-01T07:00:00.000Z'"
    expect(calls.map((c) => c.body.variables.query)).toEqual([query, query])
    expect(calls[1]!.body.variables.after).toBe('c1')
    expect(first.narrowed).toBe(true)
    expect(last.narrowed).toBe(true)
    expect(last.nextState.backfillComplete).toBe(true)
  })

  it('marks a rate-limited page narrowed too', async () => {
    stubGraphql([
      { body: { errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }] } },
    ])
    const result = await sync('order', [august])
    expect(result.rateLimited).toBeDefined()
    expect(result.narrowed).toBe(true)
  })

  it('runs a customer id fetch alongside the delta', async () => {
    const calls = stubGraphql([emptyPage('customers')])
    const result = await sync('customer', [ids(['7001', '7002'])], {
      updatedSince: '2026-08-15T00:00:00Z',
    })
    expect(calls[0]!.body.variables.query).toBe(
      "updated_at:>='2026-08-15T00:00:00.000Z' AND (id:7001 OR id:7002)"
    )
    expect(result.narrowed).toBe(true)
  })

  it('runs a product id fetch under the forced snapshot, with no delta term', async () => {
    const calls = stubGraphql([emptyPage('products')])
    const result = await sync('product', [ids(['8001'])], {
      updatedSince: '2026-08-15T00:00:00Z',
    })
    expect(calls[0]!.body.variables.query).toBe('(id:8001)')
    expect(result.narrowed).toBe(true)
  })

  it('skips the non-exact customer seed clause and leaves the page un-narrowed', async () => {
    const calls = stubGraphql([emptyPage('customers')])
    const result = await sync('customer', [{ fieldId: 'orders_count', operator: '>', value: 0 }])
    expect(calls[0]!.body.variables.query).toBeNull()
    expect(result.narrowed).toBeUndefined()
  })

  it('throws before any request for an exact clause the stream cannot push', async () => {
    const calls = stubGraphql([])
    await expect(sync('product', [august])).rejects.toBeInstanceOf(UnpushableFilterError)
    await expect(
      sync('customer', [{ fieldId: 'orders_count', operator: '>', value: 0, exact: true }])
    ).rejects.toBeInstanceOf(UnpushableFilterError)
    await expect(
      sync('order', [ids(Array.from({ length: 51 }, (_, i) => `${i + 1}`))])
    ).rejects.toBeInstanceOf(UnpushableFilterError)
    expect(calls).toHaveLength(0)
  })
})

describe('order stream declaration', () => {
  it('names createdAt as its period field', () => {
    const order = shopifyConnector.streams.find((s) => s.key === 'order')
    expect(order?.periodField).toBe('createdAt')
  })
})
