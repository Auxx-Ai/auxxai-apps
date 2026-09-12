// apps/shopify/tests/fulfillment-fanout.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest'
import shopifySync from '../src/shopify.connector.server'

/**
 * Money plan 55 (`plans/money/tasks/55-shipment-lines.md` §5): the order
 * stream now fans `fulfillments[]` / `fulfillments[].line_items[]` out into
 * per-dispatch, per-line records instead of collapsing them into the
 * `firstFulfilledAt` / `shipmentCount` rollup `deriveFulfillments` still
 * feeds.
 *
 * This is the no-network regression guard `scripts/verify-order-projection.ts`
 * cannot be - that script fetches a live store, which this task must not do.
 * Exercising the real `shopifySync` entry point with `fetch` mocked also
 * covers the page-fetch plumbing around the projection, not just the
 * projection function in isolation.
 */

const RAW_ORDER = {
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
  fulfillment_status: 'fulfilled',
  cancel_reason: null,
  payment_gateway_names: ['shopify_payments'],
  tags: '',
  note: null,
  created_at: '2024-02-11T10:00:00Z',
  updated_at: '2024-02-16T09:15:00Z',
  processed_at: '2024-02-11T10:01:00Z',
  cancelled_at: null,
  // Deliberately out of created_at order - proves `projectFulfillments` sorts
  // rather than trusting payload order.
  fulfillments: [
    {
      id: 909002,
      name: '#1001-2',
      status: 'success',
      shipment_status: null,
      created_at: '2024-02-15T14:30:00Z',
      updated_at: '2024-02-15T14:35:00Z',
      tracking_number: '1Z999AA10123456785',
      tracking_company: 'UPS',
      tracking_url: 'https://example.com/2',
      location_id: 1,
      line_items: [{ id: 11223344, variant_id: 44556677, sku: 'TSHIRT-RED-M', quantity: 1 }],
    },
    {
      id: 909001,
      name: '#1001-1',
      status: 'success',
      shipment_status: null,
      created_at: '2024-02-12T09:00:00Z',
      updated_at: '2024-02-12T09:05:00Z',
      tracking_number: '1Z999AA10123456784',
      tracking_company: 'UPS',
      tracking_url: 'https://example.com/1',
      location_id: 1,
      line_items: [{ id: 11223344, variant_id: 44556677, sku: 'TSHIRT-RED-M', quantity: 2 }],
    },
    // Voided after creation. Must land as a RECORD, not vanish - [50]'s
    // relief netting has to see this line to reverse against it.
    {
      id: 909003,
      name: '#1001-3',
      status: 'cancelled',
      shipment_status: null,
      created_at: '2024-02-16T08:00:00Z',
      updated_at: '2024-02-16T09:15:00Z',
      tracking_number: null,
      tracking_company: null,
      tracking_url: null,
      location_id: 1,
      line_items: [{ id: 11223344, variant_id: 44556677, sku: 'TSHIRT-RED-M', quantity: 1 }],
    },
  ],
  shipping_address: null,
  billing_address: null,
  customer: null,
  line_items: [
    {
      id: 11223344,
      title: 'Red T-Shirt',
      variant_title: 'Medium',
      variant_id: 44556677,
      sku: 'TSHIRT-RED-M',
      vendor: 'Acme',
      quantity: 3,
      fulfillable_quantity: 0,
      price: '19.99',
      fulfillment_status: 'fulfilled',
      product_id: 1,
      taxable: true,
      tax_lines: [],
      discount_allocations: [],
    },
  ],
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

function mockOrdersFetch(): () => Promise<FakeResponse> {
  return () =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ orders: [RAW_ORDER] }),
    })
}

describe('order stream fulfillment fan-out (money plan 55 §5)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits one fulfillment record per dispatch, cancelled included, sequenced by created_at', async () => {
    vi.stubGlobal('fetch', mockOrdersFetch())

    const result = await shopifySync({
      streamKey: 'order',
      mode: 'backfill',
      state: {},
      connection: {
        value: 'shpat_test',
        metadata: { connectionVariables: { shop: 'test-shop' } },
      },
    } as never)

    expect(result.records).toHaveLength(1)
    const fields = result.records[0]!.fields as Record<string, unknown>
    const fulfillments = fields.fulfillments as Array<Record<string, unknown>>
    expect(fulfillments).toHaveLength(3)

    const byId = new Map(fulfillments.map((f) => [f.shopifyFulfillmentId as string, f]))

    // Sequenced by created_at ascending - 909001 (Feb 12) before 909002 (Feb
    // 15) before 909003 (Feb 16), regardless of payload order.
    expect(byId.get('909001')?.sequence).toBe(1)
    expect(byId.get('909002')?.sequence).toBe(2)
    expect(byId.get('909003')?.sequence).toBe(3)

    // `shippedAt` is `created_at`, never `updated_at`.
    expect(byId.get('909001')?.shippedAt).toBe('2024-02-12T09:00:00Z')

    // Cancelled fulfillments are RECORDS, not absences.
    const cancelled = byId.get('909003')!
    expect(cancelled.status).toBe('cancelled')
    // Shopify sends no `cancelled_at` - `updated_at` is the documented proxy.
    expect(cancelled.cancelledAt).toBe('2024-02-16T09:15:00Z')
    expect(byId.get('909001')?.cancelledAt).toBeNull()

    // Singular tracking fields, not the `tracking_numbers[]` / `tracking_urls[]`
    // arrays REST also sends.
    expect(byId.get('909001')?.trackingNumber).toBe('1Z999AA10123456784')
    expect(byId.get('909001')?.trackingUrl).toBe('https://example.com/1')

    // Synthesised (fulfillment, line) identity, per fulfillment line.
    const cancelledLines = cancelled.line_items as Array<Record<string, unknown>>
    expect(cancelledLines[0]!.shopifyFulfillmentLineId).toBe('909003:11223344')
    expect(cancelledLines[0]!.id).toBe('11223344') // the ORDER line item id
    expect(cancelledLines[0]!.quantity).toBe(1)

    // The native trio and order-level rollup are UNTOUCHED and still exclude
    // cancelled fulfillments - this is an additional fan-out, not a
    // replacement of `deriveFulfillments`.
    expect(fields.shipmentCount).toBe(2)
    const lineItems = fields.line_items as Array<Record<string, unknown>>
    expect(lineItems[0]!.shipmentCount).toBe(2)
    expect(lineItems[0]!.fulfilledQuantity).toBe(3)
  })
})
