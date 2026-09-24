// apps/shopify/tests/line-item-totals.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest'
import { shopifyConnector } from '../src/shopify.connector'
import shopifySync from '../src/shopify.connector.server'
import { ordersPageBody } from './rest-order-as-graphql'

/**
 * Accounting plan 29 §2.3 (`plans/accounting/tasks/29-clearing-at-the-payment-date.md`,
 * "MK, 2026-09-14, on where the net lives"): the line total a customer sees
 * must match Shopify's per-line display, which is GROSS. So
 *
 *   - `lineTotal`  = price x qty, bound to `line_item_line_total`;
 *   - `netTotal`   = price x qty - sum of the line's discount allocations,
 *                    bound to the new `line_item_net_total`, which the ledger
 *                    posts from.
 *
 * Until this change `lineTotal` carried the net. Exercised through the real
 * `shopifySync` entry point with `fetch` mocked, the same way
 * `order-payment.test.ts` does.
 */

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

async function syncLineItems(order: unknown) {
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
  return fields.line_items as Array<Record<string, unknown>>
}

describe('line item gross and net totals (accounting plan 29 §2.3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('a discounted line keeps the gross in lineTotal and moves the allocated net to netTotal', async () => {
    const order = {
      ...BASE_ORDER,
      line_items: [
        {
          ...BASE_LINE,
          // Two allocations on one line: an order-level code and a line-level
          // sale. Both come off the net, neither off the gross.
          discount_allocations: [{ amount: '5.00' }, { amount: '1.50' }],
        },
      ],
    }
    vi.stubGlobal('fetch', mockOrdersFetch([order]))

    const [line] = await syncLineItems(order)

    // 3 x 1999, exactly what Shopify's admin shows for the line.
    expect(line!.lineTotal).toBe(5997)
    // 5997 - 500 - 150, in integer minor units.
    expect(line!.netTotal).toBe(5347)
    expect(line!.price).toBe(1999)
  })

  it('an undiscounted line projects the same value into both', async () => {
    vi.stubGlobal('fetch', mockOrdersFetch([BASE_ORDER]))

    const [line] = await syncLineItems(BASE_ORDER)

    expect(line!.lineTotal).toBe(5997)
    expect(line!.netTotal).toBe(5997)
  })

  it('binds lineTotal to line_item_line_total and netTotal to line_item_net_total', () => {
    const orderStream = shopifyConnector.streams.find((stream) => stream.key === 'order')
    const lineMapping = orderStream?.mappings.find((mapping) => mapping.rootPath === 'line_items[]')
    const fields = lineMapping?.fields ?? []

    expect(fields).toContainEqual({ sourcePath: 'lineTotal', target: 'line_item_line_total' })
    expect(fields).toContainEqual({ sourcePath: 'netTotal', target: 'line_item_net_total' })
  })

  it('carries netTotal in the example record the source schema is built from', () => {
    const orderStream = shopifyConnector.streams.find((stream) => stream.key === 'order')
    const example = orderStream?.exampleRecord as { line_items: Array<Record<string, unknown>> }

    expect(example.line_items[0]).toMatchObject({ lineTotal: 5997, netTotal: 5997 })
  })
})

describe('line item name', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('qualifies the product title with the variant, as the part title does', async () => {
    vi.stubGlobal('fetch', mockOrdersFetch([BASE_ORDER]))

    const [line] = await syncLineItems(BASE_ORDER)

    expect(line!.name).toBe('Red T-Shirt - Medium')
  })

  it.each([null, 'Default Title'])(
    'is the product title alone when the variant is %s',
    async (variantTitle) => {
      const order = { ...BASE_ORDER, line_items: [{ ...BASE_LINE, variant_title: variantTitle }] }
      vi.stubGlobal('fetch', mockOrdersFetch([order]))

      const [line] = await syncLineItems(order)

      expect(line!.name).toBe('Red T-Shirt')
    },
  )

  it('binds name to line_item_name and nothing to line_item_description', () => {
    const orderStream = shopifyConnector.streams.find((stream) => stream.key === 'order')
    const lineMapping = orderStream?.mappings.find((mapping) => mapping.rootPath === 'line_items[]')
    const fields = lineMapping?.fields ?? []

    expect(fields).toContainEqual({ sourcePath: 'name', target: 'line_item_name' })
    expect(fields.some((f) => 'target' in f && f.target === 'line_item_description')).toBe(false)
  })
})
