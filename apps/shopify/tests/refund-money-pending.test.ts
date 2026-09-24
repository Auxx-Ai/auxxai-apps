// apps/shopify/tests/refund-money-pending.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest'
import { shopifyConnector } from '../src/shopify.connector'
import shopifySync from '../src/shopify.connector.server'
import { ordersPageBody } from './rest-order-as-graphql'

// A refund whose money is still pending holds its credit memo back from issuing
// (platform brief 101 E9); `moneyPending` is what says so.

const BASE_LINE = {
  id: 11223344,
  title: 'Red T-Shirt',
  variant_title: 'Medium',
  variant_id: 44556677,
  sku: 'TSHIRT-RED-M',
  vendor: 'Acme',
  quantity: 3,
  fulfillable_quantity: 3,
  price: '19.99',
  fulfillment_status: null,
  product_id: 1,
  taxable: true,
  tax_lines: [],
  discount_allocations: [],
}

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
  line_items: [BASE_LINE],
  refunds: [],
  tax_lines: [],
  shipping_lines: [],
  discount_applications: [],
}

function mockOrdersFetch(orders: unknown[]) {
  return () =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve(ordersPageBody(orders)),
    })
}

async function syncRefunds() {
  const result = await shopifySync({
    streamKey: 'order',
    mode: 'backfill',
    state: {},
    connection: {
      value: 'shpat_test',
      metadata: { connectionVariables: { shop: 'test-shop' } },
    },
  } as never)
  const fields = result.records[0]!.fields as Record<string, unknown>
  return fields.refunds as Array<Record<string, unknown>>
}

const refundWith = (transactions: unknown[]) => ({
  ...BASE_ORDER,
  refunds: [
    {
      id: 55667788,
      created_at: '2024-02-20T11:00:00Z',
      note: null,
      refund_line_items: [],
      transactions,
    },
  ],
})

describe('refund moneyPending (101 E9)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is true while any refund transaction is pending', async () => {
    vi.stubGlobal(
      'fetch',
      mockOrdersFetch([
        refundWith([
          { id: 1, kind: 'refund', status: 'success', amount: '5.00' },
          { id: 2, kind: 'refund', status: 'pending', amount: '10.00' },
        ]),
      ]),
    )

    const [refund] = await syncRefunds()

    expect(refund!.moneyPending).toBe(true)
    // Only the settled leg counts as refunded.
    expect(refund!.amountRefunded).toBe(500)
  })

  it('is false once every refund transaction has settled, and ignores other kinds', async () => {
    vi.stubGlobal(
      'fetch',
      mockOrdersFetch([
        refundWith([
          { id: 1, kind: 'refund', status: 'success', amount: '15.00' },
          { id: 2, kind: 'void', status: 'pending', amount: '1.00' },
        ]),
      ]),
    )

    const [refund] = await syncRefunds()

    expect(refund!.moneyPending).toBe(false)
  })

  it('is false when the refund carries no transactions', async () => {
    vi.stubGlobal('fetch', mockOrdersFetch([refundWith([])]))

    const [refund] = await syncRefunds()

    expect(refund!.moneyPending).toBe(false)
  })

  it('binds to credit_memo_money_pending with overwrite, so it clears when the money settles', () => {
    const orderStream = shopifyConnector.streams.find((stream) => stream.key === 'order')
    const memoMapping = orderStream?.mappings.find((mapping) => mapping.rootPath === 'refunds[]')

    expect(memoMapping?.fields ?? []).toContainEqual({
      sourcePath: 'moneyPending',
      target: 'credit_memo_money_pending',
      mergeStrategy: 'overwrite',
    })
  })
})
