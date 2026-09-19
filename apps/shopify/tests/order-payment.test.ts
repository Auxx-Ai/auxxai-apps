// apps/shopify/tests/order-payment.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest'
import shopifySync, {
  gatewayTransactionIdOf,
  needsPaidTransactionLookup,
  resolveOrderPayment,
  resolvePaidTransaction,
} from '../src/shopify.connector.server'

/**
 * Accounting plan 29 §3.1 (`plans/accounting/tasks/29-clearing-at-the-payment-date.md`):
 * the order stream binds `paidAt` / `paidGateway` from the order's SUCCESSFUL
 * sale or capture transaction. The rule under test, from the server file's
 * "order payment" section:
 *
 *   1. one gateway, paid at checkout: `processed_at` and that gateway, NO lookup;
 *   2. several gateways (a declined attempt is listed too) or payment terms:
 *      one GraphQL `nodes(ids:)` lookup per page, the successful transaction wins;
 *   3. unpaid (`pending` terms order): both empty until a later sync sees it paid.
 *
 * Exercised through the real `shopifySync` entry point with `fetch` mocked, the
 * same way `fulfillment-fanout.test.ts` does, so the page-level `supplement`
 * plumbing (and the "no second call" claim) is what is asserted, not just the
 * pure resolvers.
 */

const BASE_ORDER = {
  id: 1234567890,
  name: '#1001',
  order_number: 1001,
  email: 'jane@example.com',
  currency: 'USD',
  total_price: '49.99',
  subtotal_price: '45.99',
  total_tax: '4.00',
  total_discounts: '0.00',
  total_shipping_price_set: { shop_money: { amount: '5.00' } },
  financial_status: 'paid',
  fulfillment_status: null,
  cancel_reason: null,
  payment_gateway_names: ['shopify_payments'],
  payment_terms: null,
  tags: '',
  note: null,
  created_at: '2024-02-11T10:00:00Z',
  updated_at: '2024-02-11T10:01:00Z',
  processed_at: '2024-02-11T10:01:00Z',
  cancelled_at: null,
  fulfillments: [],
  shipping_address: null,
  billing_address: null,
  customer: null,
  line_items: [],
  refunds: [],
  tax_lines: [],
  shipping_lines: [],
  discount_applications: [],
}

interface FakeResponse {
  ok: boolean
  status: number
  headers: { get: (name: string) => string | null }
  json: () => Promise<unknown>
}

function jsonResponse(body: unknown): FakeResponse {
  return { ok: true, status: 200, headers: { get: () => null }, json: () => Promise.resolve(body) }
}

/**
 * `fetch` that serves the REST orders page and, for the GraphQL endpoint, the
 * given `nodes` payload. Records every call so a test can assert how many
 * round trips the page cost.
 */
function mockFetch(
  orders: unknown[],
  graphqlNodes: unknown[] = orders.map((order) => ({
    legacyResourceId: String((order as { id: number }).id),
    transactions: [],
  })),
) {
  const calls: Array<{ url: string; body?: unknown }> = []
  const fetchMock = (url: string, init?: { body?: string }) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined })
    if (url.includes('/graphql.json')) {
      return Promise.resolve(jsonResponse({ data: { nodes: graphqlNodes } }))
    }
    return Promise.resolve(jsonResponse({ orders }))
  }
  return { calls, fetchMock }
}

async function syncOrders(state: Record<string, unknown> = {}) {
  return shopifySync({
    streamKey: 'order',
    mode: 'backfill',
    state,
    connection: {
      value: 'shpat_test',
      metadata: { connectionVariables: { shop: 'test-shop' } },
    },
  } as never)
}

describe('order stream paid instant and paying gateway (accounting plan 29 §3.1)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('single gateway paid at checkout: processed_at and that gateway, while fetching full transaction evidence', async () => {
    const { calls, fetchMock } = mockFetch([BASE_ORDER])
    vi.stubGlobal('fetch', fetchMock)

    const result = await syncOrders()
    const fields = result.records[0]!.fields as Record<string, unknown>

    expect(fields.paidAt).toBe('2024-02-11T10:01:00Z')
    expect(fields.paidGateway).toBe('shopify_payments')
    // The unresolved list is still projected beside it.
    expect(fields.paymentGateways).toBe('shopify_payments')
    // The source now fetches actual movements even when the legacy paid summary needs no lookup.
    expect(calls).toHaveLength(2)
    expect(calls[0]!.url).toContain('/orders.json')
  })

  it('two gateways (declined Affirm, then card): the successful transaction wins paidGateway, and the declined one drops off paymentGateways (58 §7, D12)', async () => {
    const order = {
      ...BASE_ORDER,
      payment_gateway_names: ['affirm', 'shopify_payments'],
    }
    const { calls, fetchMock } = mockFetch(
      [order],
      [
        {
          legacyResourceId: String(order.id),
          transactions: [
            {
              kind: 'SALE',
              status: 'FAILURE',
              gateway: 'affirm',
              processedAt: '2024-02-11T10:00:30Z',
            },
            {
              kind: 'SALE',
              status: 'SUCCESS',
              gateway: 'shopify_payments',
              processedAt: '2024-02-11T10:03:00Z',
            },
          ],
        },
      ],
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await syncOrders()
    const fields = result.records[0]!.fields as Record<string, unknown>

    expect(fields.paidGateway).toBe('shopify_payments')
    // The transaction's own instant, not the order's `processed_at`.
    expect(fields.paidAt).toBe('2024-02-11T10:03:00Z')
    // One gateway, not two: the declined Affirm attempt never sold anything.
    expect(fields.paymentGateways).toBe('shopify_payments')

    // Exactly one extra call, to GraphQL, asking for this one order.
    expect(calls).toHaveLength(2)
    expect(calls[1]!.url).toContain('/graphql.json')
    const body = calls[1]!.body as { variables: { ids: string[] } }
    expect(body.variables.ids).toEqual([`gid://shopify/Order/${order.id}`])
  })

  it('a pending terms order leaves both empty while fetching source observations', async () => {
    const order = {
      ...BASE_ORDER,
      financial_status: 'pending',
      payment_gateway_names: [],
      payment_terms: { payment_terms_name: 'Net 30' },
    }
    const { calls, fetchMock } = mockFetch([order])
    vi.stubGlobal('fetch', fetchMock)

    const result = await syncOrders()
    const fields = result.records[0]!.fields as Record<string, unknown>

    expect(fields.paidAt).toBeNull()
    expect(fields.paidGateway).toBeNull()
    expect(calls).toHaveLength(2)
  })

  it('a terms order seen paid on a later sync is dated by its sale transaction, not processed_at', async () => {
    const order = {
      ...BASE_ORDER,
      financial_status: 'paid',
      payment_gateway_names: ['manual'],
      payment_terms: { payment_terms_name: 'Net 30' },
      updated_at: '2024-03-12T15:00:00Z',
    }
    const { fetchMock } = mockFetch(
      [order],
      [
        {
          legacyResourceId: String(order.id),
          transactions: [
            {
              kind: 'SALE',
              status: 'SUCCESS',
              gateway: 'manual',
              processedAt: '2024-03-12T14:58:00Z',
            },
          ],
        },
      ],
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await syncOrders()
    const fields = result.records[0]!.fields as Record<string, unknown>

    expect(fields.paidAt).toBe('2024-03-12T14:58:00Z')
    expect(fields.paidGateway).toBe('manual')
  })

  it('a throttled lookup retries the page from the same cursor instead of projecting it', async () => {
    const order = { ...BASE_ORDER, payment_gateway_names: ['affirm', 'shopify_payments'] }
    vi.stubGlobal('fetch', (url: string) => {
      if (url.includes('/graphql.json')) {
        return Promise.resolve(
          jsonResponse({ errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }] }),
        )
      }
      return Promise.resolve(jsonResponse({ orders: [order] }))
    })

    const result = await syncOrders()

    expect(result.records).toHaveLength(0)
    expect(result.rateLimited).toBeDefined()
    expect(result.nextState.backfillComplete).toBeUndefined()
  })

  it('caps order pages at ten and preserves the cursor for the next page', async () => {
    const calls: string[] = []
    vi.stubGlobal('fetch', (url: string) => {
      calls.push(url)
      if (url.includes('/graphql.json'))
        return Promise.resolve(
          jsonResponse({
            data: {
              nodes: [{ legacyResourceId: String(BASE_ORDER.id), transactions: [] }],
            },
          }),
        )
      return Promise.resolve({
        ...jsonResponse({ orders: [BASE_ORDER] }),
        headers: {
          get: (name: string) =>
            name === 'Link'
              ? '<https://test-shop.myshopify.com/orders.json?page_info=next-token>; rel="next"'
              : null,
        },
      })
    })

    const first = await syncOrders()
    const firstUrl = new URL(calls[0]!)
    expect(firstUrl.searchParams.get('limit')).toBe('10')
    expect(first.nextState.cursor).toBe('next-token')

    await syncOrders({ cursor: first.nextState.cursor })
    const secondUrl = new URL(calls[2]!)
    expect(secondUrl.searchParams.get('limit')).toBe('10')
    expect(secondUrl.searchParams.get('page_info')).toBe('next-token')
  })
})

describe('resolvePaidTransaction', () => {
  it('ignores failed, pending and non-sale kinds, in either API spelling', () => {
    expect(
      resolvePaidTransaction([
        {
          kind: 'authorization',
          status: 'success',
          gateway: 'a',
          processedAt: '2024-01-01T00:00:00Z',
        },
        { kind: 'sale', status: 'pending', gateway: 'b', processedAt: '2024-01-02T00:00:00Z' },
        { kind: 'refund', status: 'success', gateway: 'c', processedAt: '2024-01-03T00:00:00Z' },
        { kind: 'CAPTURE', status: 'SUCCESS', gateway: 'd', processedAt: '2024-01-04T00:00:00Z' },
      ]),
    ).toEqual({ paidAt: '2024-01-04T00:00:00Z', paidGateway: 'd' })
  })

  it('takes the LATEST successful sale or capture', () => {
    expect(
      resolvePaidTransaction([
        { kind: 'capture', status: 'success', gateway: 'x', processedAt: '2024-01-05T00:00:00Z' },
        { kind: 'capture', status: 'success', gateway: 'x', processedAt: '2024-01-02T00:00:00Z' },
      ])?.paidAt,
    ).toBe('2024-01-05T00:00:00Z')
  })

  it('is null when nothing succeeded', () => {
    expect(resolvePaidTransaction([{ kind: 'sale', status: 'failure' }])).toBeNull()
    expect(resolvePaidTransaction([])).toBeNull()
  })
})

describe('resolveOrderPayment', () => {
  const paidSingle = {
    id: 1,
    financial_status: 'paid',
    payment_gateway_names: ['shopify_payments'],
    payment_terms: null,
    processed_at: '2024-02-11T10:01:00Z',
  }

  it('needs no lookup for a single-gateway checkout-paid order, and none for an unpaid one', () => {
    expect(needsPaidTransactionLookup(paidSingle)).toBe(false)
    expect(needsPaidTransactionLookup({ ...paidSingle, financial_status: 'pending' })).toBe(false)
    expect(
      needsPaidTransactionLookup({ ...paidSingle, payment_gateway_names: ['affirm', 'card'] }),
    ).toBe(true)
    expect(needsPaidTransactionLookup({ ...paidSingle, payment_terms: {} })).toBe(true)
  })

  it('refunded and partially refunded orders were paid, and keep their paid instant', () => {
    for (const status of ['refunded', 'partially_refunded']) {
      expect(resolveOrderPayment({ ...paidSingle, financial_status: status }, new Map())).toEqual({
        paidAt: '2024-02-11T10:01:00Z',
        paidGateway: 'shopify_payments',
      })
    }
  })

  it('a $0 order lists no gateway: paid at processed_at, gateway null', () => {
    expect(resolveOrderPayment({ ...paidSingle, payment_gateway_names: [] }, new Map())).toEqual({
      paidAt: '2024-02-11T10:01:00Z',
      paidGateway: null,
    })
  })

  it('an order that needed a lookup and got none stays empty rather than guessed', () => {
    const multi = { ...paidSingle, payment_gateway_names: ['affirm', 'shopify_payments'] }
    expect(resolveOrderPayment(multi, new Map())).toEqual({ paidAt: null, paidGateway: null })
  })
})

describe('42C actual transaction source projection', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('preserves multiple captures and a partial refund as separate exact source objects', async () => {
    const order = {
      ...BASE_ORDER,
      refunds: [
        { id: 71, transactions: [{ id: 3, kind: 'refund', status: 'success', amount: '10.00' }] },
      ],
    }
    const tx = (id: number, amount: string, kind = 'CAPTURE') => ({
      id: `gid://shopify/OrderTransaction/${id}`,
      kind,
      status: 'SUCCESS',
      gateway: 'stripe',
      processedAt: '2026-09-01T01:30:00Z',
      amountSet: { presentmentMoney: { amount, currencyCode: 'USD' } },
      settlementCurrency: 'USD',
      parentTransaction: kind === 'REFUND' ? { id: 'gid://shopify/OrderTransaction/1' } : null,
      paymentId: `payment${id}`,
      test: false,
    })
    const { calls, fetchMock } = mockFetch(
      [order],
      [
        {
          legacyResourceId: String(order.id),
          transactions: [tx(1, '60.00'), tx(2, '40.00'), tx(3, '10.00', 'REFUND')],
        },
      ],
    )
    vi.stubGlobal('fetch', fetchMock)
    const result = await syncOrders()
    const fields = result.records[0]!.fields
    const transactions = fields.paymentTransactions as Array<{ id: string; amount: string }>
    expect(fields.paymentSourceComplete).toBe(true)
    expect(transactions.map((transaction) => [transaction.id, transaction.amount])).toEqual([
      ['1', '60.00'],
      ['2', '40.00'],
      ['3', '10.00'],
    ])
    expect(transactions[2]).toMatchObject({
      parentTransactionId: '1',
      creditMemoExternalId: '71',
      kind: 'refund',
      status: 'confirmed',
      providerKey: 'shopify',
      orderExternalId: String(order.id),
    })
    expect(fields).toMatchObject({
      paymentSourceProvider: 'shopify',
      paymentSourceOrderId: String(order.id),
      paymentSourceUpdatedAt: order.updated_at,
    })
    expect(fields).not.toHaveProperty('financialTransactions')
    expect(JSON.stringify(calls[1]!.body)).toContain('amountSet')
  })
  it('refuses missing GraphQL nodes instead of claiming an empty complete source', async () => {
    const { fetchMock } = mockFetch([BASE_ORDER], [])
    vi.stubGlobal('fetch', fetchMock)
    await expect(syncOrders()).rejects.toThrow('missing order transaction coverage')
  })
})

/**
 * authorize-net plan §6A: the gateway's own two ids ride out on each projected
 * transaction, so a settled Authorize.net batch member can be joined back to the
 * order it paid for.
 */
describe('the gateway ids on a projected transaction', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reads transaction_id off the receipt and keeps the authorization code', async () => {
    const { fetchMock } = mockFetch(
      [BASE_ORDER],
      [
        {
          legacyResourceId: String(BASE_ORDER.id),
          transactions: [
            {
              id: 'gid://shopify/OrderTransaction/1',
              kind: 'SALE',
              status: 'SUCCESS',
              gateway: 'authorize_net',
              processedAt: '2026-05-19T01:30:00Z',
              amountSet: { presentmentMoney: { amount: '49.99', currencyCode: 'USD' } },
              authorizationCode: 'A1B2C3',
              receiptJson: { transaction_id: 60000012345, response_code: '1' },
            },
          ],
        },
      ],
    )
    vi.stubGlobal('fetch', fetchMock)
    const result = await syncOrders()
    const transactions = (result.records[0]!.fields as { paymentTransactions: unknown[] })
      .paymentTransactions
    expect(transactions[0]).toMatchObject({
      authorizationCode: 'A1B2C3',
      gatewayTransactionId: '60000012345',
    })
  })

  it('never throws on a receipt it cannot read', () => {
    expect(gatewayTransactionIdOf({ transaction_id: '60000012345' })).toBe('60000012345')
    expect(gatewayTransactionIdOf({ transaction_id: 60000012345 })).toBe('60000012345')
    for (const receipt of [
      null,
      undefined,
      '{"transaction_id":"1"}',
      [{ transaction_id: '1' }],
      {},
      { transaction_id: '' },
      { transaction_id: null },
      { transaction_id: { id: 1 } },
      { transaction_id: Number.NaN },
    ])
      expect(gatewayTransactionIdOf(receipt)).toBeNull()
  })
})
