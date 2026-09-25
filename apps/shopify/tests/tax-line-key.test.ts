// apps/shopify/tests/tax-line-key.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest'
import shopifySync from '../src/shopify.connector.server'
import { ordersPageBody } from './rest-order-as-graphql'

/**
 * A Shopify tax line has no id, so `projectTaxLine` synthesises one. Tennessee
 * is the case that broke the title-only key: above $1,600 an order carries a 7%
 * "Tennessee State Tax" line AND a 2.75% single-article line under the same
 * title, and the second overwrote the first (accounting 76 §1.2). The key is
 * (order, title, rate). Driven through the real `shopifySync` entry point with
 * `fetch` mocked, the way `line-item-totals.test.ts` does.
 */

const ORDER = {
  id: 1234567890,
  name: '#1001',
  order_number: 1001,
  email: 'jane@example.com',
  currency: 'USD',
  total_price: '3752.75',
  subtotal_price: '3425.00',
  total_tax: '327.75',
  total_discounts: '0.00',
  total_shipping_price_set: { shop_money: { amount: '0.00' } },
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
  tax_lines: [
    {
      title: 'Tennessee State Tax',
      rate: 0.07,
      price_set: { shop_money: { amount: '239.75' } },
      channel_liable: false,
    },
    {
      title: 'Tennessee State Tax',
      rate: 0.0275,
      price_set: { shop_money: { amount: '44.00' } },
      channel_liable: false,
    },
    {
      title: 'Williamson County Tax',
      rate: 0.0275,
      price_set: { shop_money: { amount: '44.00' } },
      channel_liable: false,
    },
  ],
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

describe('the synthetic tax line key', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps two same-titled lines at different rates apart, and their sum is the order tax', async () => {
    vi.stubGlobal('fetch', mockOrdersFetch([ORDER]))

    const result = await shopifySync({
      streamKey: 'order',
      query: {},
      connection: { value: 'shpat_test', metadata: { connectionVariables: { shop: 'test-shop' } } },
    } as never)
    const fields = result.records[0]!.fields as Record<string, unknown>
    const lines = fields.tax_lines as Array<{ taxLineKey: string; price: number }>

    expect(lines.map((line) => line.taxLineKey)).toEqual([
      '1234567890:Tennessee State Tax:0.07',
      '1234567890:Tennessee State Tax:0.0275',
      '1234567890:Williamson County Tax:0.0275',
    ])
    expect(new Set(lines.map((line) => line.taxLineKey)).size).toBe(3)
    expect(lines.reduce((sum, line) => sum + line.price, 0)).toBe(32775)
  })
})
