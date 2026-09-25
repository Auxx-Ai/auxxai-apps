// apps/shopify/tests/graphql-order.test.ts

import type { ConnectorQuery } from '@auxx/sdk/data-connectors'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CANCEL_REASON,
  FINANCIAL_STATUS,
  FULFILLMENT_STATUS,
  type GqlFulfillment,
  type GqlOrder,
  gidTail,
  ORDER_FULFILLMENT_STATUS,
  RESTOCK_TYPE,
  SHIPMENT_STATUS,
  TRANSACTION_KIND,
  TRANSACTION_STATUS,
  toRawOrder,
} from '../src/graphql/order'
import shopifySync from '../src/shopify.connector.server'
import { connection, stubGraphql } from './graphql-test-support'

const done = <N>(nodes: N[]) => ({ nodes, pageInfo: { hasNextPage: false, endCursor: null } })
const more = <N>(nodes: N[], endCursor: string) => ({
  nodes,
  pageInfo: { hasNextPage: true, endCursor },
})
const shop = (amount: string) => ({ shopMoney: { amount } })

const capture = (id: number, amount: string, processedAt: string, status = 'SUCCESS') => ({
  id: `gid://shopify/OrderTransaction/${id}`,
  kind: 'CAPTURE',
  status,
  gateway: 'shopify_payments',
  processedAt,
  amountSet: { presentmentMoney: { amount, currencyCode: 'USD' } },
  settlementCurrency: 'USD',
  parentTransaction: { id: 'gid://shopify/OrderTransaction/9001' },
  paymentId: `p${id}`,
  test: false,
  authorizationCode: 'AUTH1',
  receiptJson: null,
})

const fulfillment = (
  id: number,
  status: string,
  displayStatus: string | null,
  createdAt: string,
  quantity: number
): GqlFulfillment => ({
  id: `gid://shopify/Fulfillment/${id}`,
  legacyResourceId: String(id),
  name: `#1001-${id}`,
  status,
  displayStatus,
  createdAt,
  updatedAt: createdAt.replace('T10', 'T12'),
  trackingInfo: [{ number: `TRK${id}`, company: 'UPS', url: `https://t.example/${id}` }],
  location: { legacyResourceId: '77' },
  fulfillmentLineItems: done([
    {
      quantity,
      lineItem: {
        id: 'gid://shopify/LineItem/501',
        sku: 'RED-M',
        variant: { legacyResourceId: '601' },
      },
    },
  ]),
})

/** Authorized at checkout, captured twice later, part-returned with restock, one fulfillment voided. */
const ORDER: GqlOrder = {
  id: 'gid://shopify/Order/1001',
  legacyResourceId: '1001',
  name: '#1001',
  number: 1001,
  email: 'dealer@example.com',
  currencyCode: 'USD',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-06T09:00:00Z',
  processedAt: '2026-09-01T10:00:00Z',
  cancelledAt: null,
  cancelReason: null,
  note: 'leave at dock',
  tags: ['wholesale', 'vip'],
  displayFinancialStatus: 'PARTIALLY_REFUNDED',
  displayFulfillmentStatus: 'PARTIALLY_FULFILLED',
  paymentGatewayNames: ['shopify_payments'],
  totalPriceSet: shop('110.00'),
  subtotalPriceSet: shop('100.00'),
  totalTaxSet: shop('0.00'),
  totalDiscountsSet: shop('5.00'),
  totalShippingPriceSet: shop('10.00'),
  shippingAddress: {
    address1: '1 Dock Rd',
    address2: null,
    city: 'Portland',
    province: 'Oregon',
    zip: '97201',
    country: 'United States',
  },
  billingAddress: null,
  customer: {
    legacyResourceId: '7001',
    firstName: 'Dana',
    lastName: 'Dealer',
    taxExempt: true,
    defaultEmailAddress: { emailAddress: 'dealer@example.com' },
  },
  taxLines: [{ title: 'OR Tax', rate: 0, priceSet: shop('0.00'), channelLiable: false }],
  lineItems: done([
    {
      id: 'gid://shopify/LineItem/501',
      title: 'Red T-Shirt',
      variantTitle: 'Medium',
      sku: 'RED-M',
      vendor: 'Acme',
      quantity: 3,
      unfulfilledQuantity: 1,
      taxable: true,
      variant: { legacyResourceId: '601' },
      product: { legacyResourceId: '401' },
      originalUnitPriceSet: shop('30.00'),
      taxLines: [{ title: 'OR Tax', rate: 0, priceSet: shop('0.00'), channelLiable: false }],
      discountAllocations: [{ allocatedAmountSet: shop('5.00') }],
    },
    {
      id: 'gid://shopify/LineItem/502',
      title: 'Custom engraving',
      variantTitle: null,
      sku: null,
      vendor: null,
      quantity: 1,
      unfulfilledQuantity: 1,
      taxable: false,
      variant: null,
      product: null,
      originalUnitPriceSet: shop('10.00'),
      taxLines: [],
      discountAllocations: [],
    },
  ]),
  fulfillments: [
    fulfillment(801, 'SUCCESS', 'DELIVERED', '2026-09-02T10:00:00Z', 2),
    fulfillment(802, 'CANCELLED', 'CANCELED', '2026-09-03T10:00:00Z', 1),
  ],
  refunds: [
    {
      id: 'gid://shopify/Refund/901',
      legacyResourceId: '901',
      createdAt: '2026-09-06T08:00:00Z',
      note: 'one returned',
      refundLineItems: done([
        {
          id: 'gid://shopify/RefundLineItem/951',
          quantity: 1,
          restockType: 'RETURN',
          lineItem: { id: 'gid://shopify/LineItem/501', title: 'Red T-Shirt' },
          subtotalSet: shop('28.33'),
          totalTaxSet: shop('0.00'),
        },
      ]),
      transactions: done([
        {
          id: 'gid://shopify/OrderTransaction/9004',
          kind: 'REFUND',
          status: 'SUCCESS',
          amountSet: shop('28.33'),
        },
      ]),
    },
  ],
  transactions: [
    {
      ...capture(9001, '110.00', '2026-09-01T10:00:00Z'),
      kind: 'AUTHORIZATION',
      parentTransaction: null,
    },
    capture(9002, '60.00', '2026-09-02T10:05:00Z'),
    capture(9003, '50.00', '2026-09-05T15:00:00Z'),
  ],
  shippingLines: done([
    { title: 'Freight', code: 'FRT', source: 'shopify', originalPriceSet: shop('10.00') },
  ]),
  discountApplications: done([
    {
      __typename: 'DiscountCodeApplication',
      allocationMethod: 'ACROSS',
      targetSelection: 'ALL',
      targetType: 'LINE_ITEM',
      value: { __typename: 'MoneyV2', amount: '5.00' },
      code: 'DEALER5',
    },
  ]),
}

/** A guest order paid at checkout, nothing shipped, nothing refunded. */
const GUEST: GqlOrder = {
  ...ORDER,
  id: 'gid://shopify/Order/1002',
  legacyResourceId: '1002',
  name: '#1002',
  customer: null,
  displayFinancialStatus: 'PAID',
  displayFulfillmentStatus: 'UNFULFILLED',
  fulfillments: [],
  refunds: [],
  transactions: [{ ...capture(9101, '110.00', '2026-09-01T10:00:00Z'), kind: 'SALE' }],
}

const ordersPage = (nodes: GqlOrder[], endCursor: string | null = null) => ({
  body: {
    data: { orders: { nodes, pageInfo: { hasNextPage: endCursor !== null, endCursor } } },
  },
})

function syncOrders(cursor?: unknown, query: ConnectorQuery = { since: '2026-09-01T00:00:00Z' }) {
  return shopifySync({ streamKey: 'order', query, cursor, config: {}, connection })
}

afterEach(() => vi.unstubAllGlobals())

describe('toRawOrder', () => {
  it('adapts the order into the REST shape, money strings verbatim', () => {
    const raw = toRawOrder(ORDER)
    expect(raw).toMatchObject({
      id: 1001,
      name: '#1001',
      order_number: 1001,
      email: 'dealer@example.com',
      currency: 'USD',
      total_price: '110.00',
      subtotal_price: '100.00',
      total_tax: '0.00',
      total_discounts: '5.00',
      total_shipping_price_set: { shop_money: { amount: '10.00' } },
      financial_status: 'partially_refunded',
      fulfillment_status: 'partial',
      cancel_reason: null,
      payment_gateway_names: ['shopify_payments'],
      tags: 'wholesale, vip',
      note: 'leave at dock',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-06T09:00:00Z',
      processed_at: '2026-09-01T10:00:00Z',
      cancelled_at: null,
      billing_address: null,
      customer: {
        id: 7001,
        email: 'dealer@example.com',
        first_name: 'Dana',
        last_name: 'Dealer',
        tax_exempt: true,
      },
      tax_lines: [
        {
          title: 'OR Tax',
          rate: 0,
          price_set: { shop_money: { amount: '0.00' } },
          channel_liable: false,
        },
      ],
    })
    expect(raw.shipping_address).toEqual({
      address1: '1 Dock Rd',
      address2: null,
      city: 'Portland',
      province: 'Oregon',
      zip: '97201',
      country: 'United States',
    })
    expect(raw.transactions).toBe(ORDER.transactions)
  })

  it('adapts line items: gid-tail ids, unfulfilledQuantity, derived status, variant: null', () => {
    const [shirt, engraving] = toRawOrder(ORDER).line_items!
    expect(shirt).toEqual({
      id: 501,
      title: 'Red T-Shirt',
      variant_title: 'Medium',
      variant_id: 601,
      sku: 'RED-M',
      vendor: 'Acme',
      quantity: 3,
      fulfillable_quantity: 1,
      price: '30.00',
      fulfillment_status: 'partial',
      product_id: 401,
      taxable: true,
      tax_lines: [
        {
          title: 'OR Tax',
          rate: 0,
          price_set: { shop_money: { amount: '0.00' } },
          channel_liable: false,
        },
      ],
      discount_allocations: [{ amount: '5.00' }],
    })
    expect(engraving).toMatchObject({
      id: 502,
      variant_id: null,
      product_id: null,
      fulfillable_quantity: 1,
      fulfillment_status: null,
    })
  })

  it('derives the line fulfillment_status from live fulfillments, not unfulfilledQuantity', () => {
    const f0 = ORDER.fulfillments[0]!
    const status = (unfulfilledQuantity: number, fulfillments: GqlFulfillment[]) =>
      toRawOrder({
        ...ORDER,
        lineItems: done([{ ...ORDER.lineItems.nodes[0]!, quantity: 3, unfulfilledQuantity }]),
        fulfillments,
      }).line_items![0]!.fulfillment_status
    const shipped = (id: number, quantity: number, fulfillmentStatus = 'SUCCESS') =>
      fulfillment(id, fulfillmentStatus, 'DELIVERED', f0.createdAt!, quantity)

    expect(status(3, [])).toBeNull()
    expect(status(1, [shipped(801, 2)])).toBe('partial')
    expect(status(0, [shipped(801, 2), shipped(803, 1)])).toBe('fulfilled')
    expect(status(3, [shipped(801, 3, 'CANCELLED')])).toBeNull()
    // Refunded before shipping: nothing left to fulfil, but nothing shipped either.
    expect(status(0, [])).toBeNull()
  })

  it('adapts fulfillments, the cancelled one included', () => {
    const [shipped, voided] = toRawOrder(ORDER).fulfillments!
    expect(shipped).toEqual({
      id: 801,
      name: '#1001-801',
      status: 'success',
      shipment_status: 'delivered',
      created_at: '2026-09-02T10:00:00Z',
      updated_at: '2026-09-02T12:00:00Z',
      tracking_number: 'TRK801',
      tracking_company: 'UPS',
      tracking_url: 'https://t.example/801',
      location_id: 77,
      line_items: [{ id: 501, variant_id: 601, sku: 'RED-M', quantity: 2 }],
    })
    expect(voided).toMatchObject({ id: 802, status: 'cancelled', shipment_status: 'canceled' })
  })

  it('adapts refunds: gid-tail line and transaction ids, restock type, shop money', () => {
    expect(toRawOrder(ORDER).refunds).toEqual([
      {
        id: 901,
        created_at: '2026-09-06T08:00:00Z',
        note: 'one returned',
        refund_line_items: [
          {
            id: 951,
            line_item_id: 501,
            line_item: { title: 'Red T-Shirt' },
            quantity: 1,
            subtotal_set: { shop_money: { amount: '28.33' } },
            total_tax_set: { shop_money: { amount: '0.00' } },
            restock_type: 'return',
          },
        ],
        transactions: [{ id: 9004, kind: 'refund', status: 'success', amount: '28.33' }],
      },
    ])
  })

  it('folds shipping lines and discount applications in REST shape', () => {
    const raw = toRawOrder(ORDER)
    expect(raw.shipping_lines).toEqual([
      {
        title: 'Freight',
        code: 'FRT',
        source: 'shopify',
        price: '10.00',
        price_set: { shop_money: { amount: '10.00' } },
      },
    ])
    expect(raw.discount_applications).toEqual([
      {
        type: 'discount_code',
        value: '5.00',
        value_type: 'fixed_amount',
        allocation_method: 'across',
        target_selection: 'all',
        target_type: 'line_item',
        code: 'DEALER5',
      },
    ])
  })

  it('adapts a guest order with no customer', () => {
    expect(toRawOrder(GUEST).customer).toBeNull()
  })

  it('refuses a connection that still has a next page', () => {
    const truncated = { ...ORDER, lineItems: more(ORDER.lineItems.nodes, 'li-2') }
    expect(() => toRawOrder(truncated)).toThrow('lineItems is truncated')
  })
})

describe('enum tables', () => {
  it('maps exactly the plan §6.2 values', () => {
    expect(FINANCIAL_STATUS).toEqual({
      PENDING: 'pending',
      AUTHORIZED: 'authorized',
      PARTIALLY_PAID: 'partially_paid',
      PAID: 'paid',
      PARTIALLY_REFUNDED: 'partially_refunded',
      REFUNDED: 'refunded',
      VOIDED: 'voided',
      EXPIRED: 'expired',
    })
    expect(ORDER_FULFILLMENT_STATUS).toEqual({
      UNFULFILLED: null,
      FULFILLED: 'fulfilled',
      PARTIALLY_FULFILLED: 'partial',
      RESTOCKED: 'restocked',
    })
    expect(CANCEL_REASON.CUSTOMER).toBe('customer')
    expect(RESTOCK_TYPE).toEqual({
      CANCEL: 'cancel',
      RETURN: 'return',
      NO_RESTOCK: 'no_restock',
      LEGACY_RESTOCK: 'legacy_restock',
    })
    expect(FULFILLMENT_STATUS.SUCCESS).toBe('success')
    expect(FULFILLMENT_STATUS.CANCELLED).toBe('cancelled')
    expect(SHIPMENT_STATUS.FULFILLED).toBeNull()
    expect(SHIPMENT_STATUS.NOT_DELIVERED).toBe('failure')
    expect(SHIPMENT_STATUS.IN_TRANSIT).toBe('in_transit')
    expect(TRANSACTION_KIND.REFUND).toBe('refund')
    expect(TRANSACTION_STATUS).toEqual({
      SUCCESS: 'success',
      FAILURE: 'failure',
      PENDING: 'pending',
      ERROR: 'error',
      AWAITING_RESPONSE: 'pending',
      UNKNOWN: 'pending',
    })
  })

  it('maps order-level enums through the adapter', () => {
    const raw = toRawOrder({
      ...ORDER,
      displayFinancialStatus: 'PAID',
      displayFulfillmentStatus: 'UNFULFILLED',
      cancelReason: 'CUSTOMER',
    })
    expect(raw.financial_status).toBe('paid')
    expect(raw.fulfillment_status).toBeNull()
    expect(raw.cancel_reason).toBe('customer')
  })

  it('throws on every unknown value instead of lowercasing it', () => {
    const f0 = ORDER.fulfillments[0]!
    const r0 = ORDER.refunds[0]!
    const rl0 = r0.refundLineItems.nodes[0]!
    const rt0 = r0.transactions.nodes[0]!
    const cases: Array<[GqlOrder, string]> = [
      [{ ...ORDER, displayFinancialStatus: 'PARTIALLY_AUTHORIZED' }, 'financial status'],
      [{ ...ORDER, displayFulfillmentStatus: 'ON_HOLD' }, 'fulfillment status'],
      [{ ...ORDER, displayFulfillmentStatus: 'IN_PROGRESS' }, 'fulfillment status'],
      [{ ...ORDER, cancelReason: 'BORED' }, 'cancel reason'],
      [{ ...ORDER, fulfillments: [{ ...f0, status: 'LOST' }] }, 'fulfillment status'],
      [{ ...ORDER, fulfillments: [{ ...f0, displayStatus: 'TELEPORTED' }] }, 'displayStatus'],
      [
        { ...ORDER, refunds: [{ ...r0, refundLineItems: done([{ ...rl0, restockType: 'X' }]) }] },
        'restockType',
      ],
      [
        { ...ORDER, refunds: [{ ...r0, transactions: done([{ ...rt0, kind: 'GIFT' }]) }] },
        'transaction kind',
      ],
      [
        {
          ...ORDER,
          refunds: [{ ...r0, transactions: done([{ ...rt0, status: 'SETTLING' }]) }],
        },
        'transaction status',
      ],
    ]
    for (const [order, label] of cases) expect(() => toRawOrder(order)).toThrow(label)
  })
})

describe('unresolved transaction statuses', () => {
  it('read as pending: the memo waits and the leg is not counted as refunded', async () => {
    const r0 = ORDER.refunds[0]!
    const settled = r0.transactions.nodes[0]!
    const awaiting = {
      ...settled,
      id: 'gid://shopify/OrderTransaction/9005',
      status: 'AWAITING_RESPONSE',
      amountSet: shop('10.00'),
    }
    stubGraphql([
      ordersPage([{ ...ORDER, refunds: [{ ...r0, transactions: done([settled, awaiting]) }] }]),
    ])
    const [refund] = (await syncOrders()).records[0]!.fields.refunds as Array<
      Record<string, unknown>
    >
    expect(refund).toMatchObject({ moneyPending: true, amountRefunded: 2833 })
  })
})

describe('gidTail', () => {
  it('reads the numeric tail of the sanctioned types only', () => {
    expect(gidTail('gid://shopify/LineItem/501', 'LineItem')).toBe(501)
    expect(gidTail('gid://shopify/RefundLineItem/951', 'RefundLineItem')).toBe(951)
    expect(() => gidTail('gid://shopify/Order/501', 'LineItem')).toThrow('LineItem gid')
    expect(() => gidTail('gid://shopify/LineItem/abc', 'LineItem')).toThrow()
    expect(() => gidTail('gid://shopify/LineItem/9007199254740993', 'LineItem')).toThrow()
    expect(() => gidTail(501, 'LineItem')).toThrow()
  })
})

describe('D9 payment_terms inference', () => {
  it('marks an order paid after processedAt, and routes paidAt to the last capture', async () => {
    expect(toRawOrder(ORDER).payment_terms).not.toBeNull()
    stubGraphql([ordersPage([{ ...ORDER, displayFinancialStatus: 'PAID' }])])
    const fields = (await syncOrders()).records[0]!.fields
    expect(fields.paidAt).toBe('2026-09-05T15:00:00Z')
    expect(fields.paidGateway).toBe('shopify_payments')
  })

  it('leaves a checkout-paid order unmarked, paid at processed_at', async () => {
    expect(toRawOrder(GUEST).payment_terms).toBeNull()
    stubGraphql([ordersPage([GUEST])])
    expect((await syncOrders()).records[0]!.fields.paidAt).toBe('2026-09-01T10:00:00Z')
  })

  it('ignores a later capture that failed', () => {
    const order = {
      ...GUEST,
      transactions: [
        ...GUEST.transactions,
        capture(9102, '1.00', '2026-09-09T00:00:00Z', 'FAILURE'),
      ],
    }
    expect(toRawOrder(order).payment_terms).toBeNull()
  })
})

describe('no silent truncation', () => {
  it('pages a nested connection with hasNextPage through a follow-up order(id:) query', async () => {
    const extra = { ...ORDER.lineItems.nodes[1]!, id: 'gid://shopify/LineItem/503' }
    const calls = stubGraphql([
      ordersPage([{ ...GUEST, lineItems: more(ORDER.lineItems.nodes, 'li-2') }]),
      { body: { data: { order: { lineItems: done([extra]) } } } },
    ])
    const result = await syncOrders()
    expect(calls).toHaveLength(2)
    expect(calls[1]!.body.query).toContain('order(id: $id) { lineItems(first: 100, after: $after)')
    expect(calls[1]!.body.variables).toEqual({ id: 'gid://shopify/Order/1002', after: 'li-2' })
    const lines = result.records[0]!.fields.line_items as Array<{ shopifyId: string }>
    expect(lines.map((l) => l.shopifyId)).toEqual(['501', '502', '503'])
  })

  it('pages a connection under a fulfillment through node(id:)', async () => {
    const f0 = ORDER.fulfillments[0]!
    const calls = stubGraphql([
      ordersPage([
        {
          ...ORDER,
          fulfillments: [{ ...f0, fulfillmentLineItems: more(f0.fulfillmentLineItems.nodes, 'f') }],
        },
      ]),
      { body: { data: { node: { fulfillmentLineItems: done(f0.fulfillmentLineItems.nodes) } } } },
    ])
    const result = await syncOrders()
    expect(calls[1]!.body.query).toContain('... on Fulfillment { fulfillmentLineItems(')
    const [shipment] = result.records[0]!.fields.fulfillments as Array<{ line_items: unknown[] }>
    expect(shipment!.line_items).toHaveLength(2)
  })

  it('re-queries a full plain list at the maximum and projects the complete list', async () => {
    const full = Array.from({ length: 50 }, (_, i) =>
      capture(20000 + i, '1.00', GUEST.processedAt!)
    )
    const calls = stubGraphql([
      ordersPage([{ ...GUEST, transactions: full }]),
      {
        body: {
          data: { order: { transactions: [...full, capture(30000, '1.00', GUEST.processedAt!)] } },
        },
      },
    ])
    const result = await syncOrders()
    expect(calls[1]!.body.query).toContain('transactions(first: 250)')
    expect(calls[1]!.body.variables).toEqual({ id: 'gid://shopify/Order/1002' })
    expect(result.records[0]!.fields.paymentTransactions).toHaveLength(51)
    expect(result.records[0]!.fields.paymentSourceComplete).toBe(true)
  })

  it('throws when the re-queried list is still full', async () => {
    const f0 = ORDER.fulfillments[0]!
    const fifty = Array.from({ length: 50 }, () => f0)
    stubGraphql([
      ordersPage([{ ...ORDER, fulfillments: fifty }]),
      { body: { data: { order: { fulfillments: Array.from({ length: 250 }, () => f0) } } } },
    ])
    await expect(syncOrders()).rejects.toThrow('refusing to truncate')
  })

  it('a throttled follow-up retries the whole page from the same cursor', async () => {
    stubGraphql([
      ordersPage([GUEST, { ...ORDER, lineItems: more(ORDER.lineItems.nodes, 'li-2') }], 'next'),
      {
        body: {
          errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }],
          extensions: {
            cost: {
              requestedQueryCost: 300,
              throttleStatus: { currentlyAvailable: 100, restoreRate: 100 },
            },
          },
        },
      },
    ])
    const result = await syncOrders({ v: 3, after: 'prev' })
    // No cursor and no since: the platform retries the same page.
    expect(result).toEqual({ records: [], rateLimited: { retryAfterMs: 2000 } })
  })
})

describe('shopifySync order stream', () => {
  it('fetches one GraphQL page with transactions inline and projects it', async () => {
    const calls = stubGraphql([ordersPage([ORDER, GUEST], 'c-1')])
    const result = await syncOrders()

    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe('https://test-shop.myshopify.com/admin/api/2026-07/graphql.json')
    expect(calls[0]!.body.query).toContain('orders(first: $first, after: $after, query: $query')
    expect(calls[0]!.body.query).toContain('sortKey: UPDATED_AT')
    expect(calls[0]!.body.query).not.toContain('paymentTerms')
    expect(calls[0]!.body.variables).toEqual({
      first: 25,
      after: null,
      query: "updated_at:>='2026-09-01T00:00:00.000Z'",
    })
    expect(result.cursor).toEqual({ v: 3, after: 'c-1' })
    expect(result.since).toBeUndefined()

    const [order, guest] = result.records
    expect(order).toMatchObject({ streamKey: 'order', externalId: '1001', displayName: '#1001' })
    const fields = order!.fields
    expect(fields).toMatchObject({
      shopify_id: '1001',
      totalPrice: 11000,
      totalShipping: 1000,
      financialStatus: 'partially_refunded',
      fulfillmentStatus: 'partial',
      paymentGateways: 'shopify_payments',
      paidAt: '2026-09-05T15:00:00Z',
      shipmentCount: 1,
      tags: 'wholesale, vip',
      paymentSourceComplete: true,
      customer: { id: '7001', taxExempt: true },
    })
    const refunds = fields.refunds as Array<Record<string, unknown>>
    expect(refunds[0]).toMatchObject({ shopifyRefundId: '901', amountRefunded: 2833 })
    const payments = fields.paymentTransactions as Array<Record<string, unknown>>
    expect(payments.map((p) => [p.id, p.kind])).toEqual([
      ['9001', 'authorization'],
      ['9002', 'receipt'],
      ['9003', 'receipt'],
    ])
    expect(guest!.fields.customer).toBeNull()
  })

  it('returns the page max as since on the last page', async () => {
    stubGraphql([ordersPage([ORDER, GUEST])])
    const result = await syncOrders()
    expect(result.cursor).toBeUndefined()
    expect(result.since).toBe('2026-09-06T09:00:00Z')
  })

  it('sends a period re-import as created_at bounds, and ids as an id search', async () => {
    const calls = stubGraphql([ordersPage([]), ordersPage([])])
    await syncOrders(undefined, {
      period: { from: '2026-08-01T00:00:00Z', to: '2026-09-01T00:00:00Z' },
    })
    await syncOrders(undefined, { ids: ['1001', '1002'] })
    expect(calls[0]!.body.variables.query).toBe(
      "created_at:>='2026-08-01T00:00:00.000Z' AND created_at:<'2026-09-01T00:00:00.000Z'"
    )
    expect(calls[1]!.body.variables.query).toBe('(id:1001 OR id:1002)')
  })
})
