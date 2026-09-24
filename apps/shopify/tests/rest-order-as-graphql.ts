// apps/shopify/tests/rest-order-as-graphql.ts
//
// Serves the REST-shaped order fixtures of the projection tests as a GraphQL `orders` page,
// so they run through the real adapter (toRawOrder) into the unchanged projection.

import type { GqlOrder } from '../src/graphql/order'
import type { OrderTransactionLike } from '../src/shopify.connector.server'

// biome-ignore lint/suspicious/noExplicitAny: loose REST fixtures
type Rest = any

const done = <N>(nodes: N[]) => ({ nodes, pageInfo: { hasNextPage: false, endCursor: null } })
const shop = (amount: string | null | undefined) =>
  amount == null ? null : { shopMoney: { amount } }
const upper = (value: string | null | undefined) => (value == null ? null : value.toUpperCase())
const ref = (id: number | null | undefined) =>
  id == null ? null : { legacyResourceId: String(id) }
const taxLine = (tl: Rest) => ({
  title: tl.title,
  rate: tl.rate,
  priceSet: shop(tl.price_set?.shop_money?.amount),
  channelLiable: tl.channel_liable,
})
const ORDER_FULFILLMENT: Record<string, string> = {
  fulfilled: 'FULFILLED',
  partial: 'PARTIALLY_FULFILLED',
  restocked: 'RESTOCKED',
}

/** The GraphQL order node the REST fixture `o` would have come from. */
export function restOrderAsGraphql(o: Rest, transactions: OrderTransactionLike[] = []): GqlOrder {
  return {
    id: `gid://shopify/Order/${o.id}`,
    legacyResourceId: String(o.id),
    name: o.name,
    number: o.order_number,
    email: o.email,
    currencyCode: o.currency,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    processedAt: o.processed_at,
    cancelledAt: o.cancelled_at,
    cancelReason: upper(o.cancel_reason),
    note: o.note,
    tags: o.tags ? String(o.tags).split(', ') : [],
    displayFinancialStatus: upper(o.financial_status),
    displayFulfillmentStatus: o.fulfillment_status
      ? ORDER_FULFILLMENT[o.fulfillment_status]!
      : 'UNFULFILLED',
    paymentGatewayNames: o.payment_gateway_names,
    totalPriceSet: shop(o.total_price),
    subtotalPriceSet: shop(o.subtotal_price),
    totalTaxSet: shop(o.total_tax),
    totalDiscountsSet: shop(o.total_discounts),
    totalShippingPriceSet: shop(o.total_shipping_price_set?.shop_money?.amount),
    shippingAddress: o.shipping_address,
    billingAddress: o.billing_address,
    customer: o.customer
      ? {
          legacyResourceId: String(o.customer.id),
          firstName: o.customer.first_name,
          lastName: o.customer.last_name,
          taxExempt: o.customer.tax_exempt,
          defaultEmailAddress: { emailAddress: o.customer.email },
        }
      : null,
    taxLines: (o.tax_lines ?? []).map(taxLine),
    lineItems: done(
      (o.line_items ?? []).map((li: Rest) => ({
        id: `gid://shopify/LineItem/${li.id}`,
        title: li.title,
        variantTitle: li.variant_title,
        sku: li.sku,
        vendor: li.vendor,
        quantity: li.quantity,
        unfulfilledQuantity: li.fulfillable_quantity,
        taxable: li.taxable,
        variant: ref(li.variant_id),
        product: ref(li.product_id),
        originalUnitPriceSet: shop(li.price),
        taxLines: (li.tax_lines ?? []).map(taxLine),
        discountAllocations: (li.discount_allocations ?? []).map((a: Rest) => ({
          allocatedAmountSet: shop(a.amount),
        })),
      })),
    ),
    fulfillments: (o.fulfillments ?? []).map((f: Rest) => ({
      id: `gid://shopify/Fulfillment/${f.id}`,
      legacyResourceId: String(f.id),
      name: f.name,
      status: upper(f.status)!,
      displayStatus: f.shipment_status == null ? 'FULFILLED' : upper(f.shipment_status),
      createdAt: f.created_at,
      updatedAt: f.updated_at,
      trackingInfo: [
        { number: f.tracking_number, company: f.tracking_company, url: f.tracking_url },
      ],
      location: ref(f.location_id),
      fulfillmentLineItems: done(
        (f.line_items ?? []).map((fl: Rest) => ({
          quantity: fl.quantity,
          lineItem: {
            id: `gid://shopify/LineItem/${fl.id}`,
            sku: fl.sku,
            variant: ref(fl.variant_id),
          },
        })),
      ),
    })),
    refunds: (o.refunds ?? []).map((r: Rest) => ({
      id: `gid://shopify/Refund/${r.id}`,
      legacyResourceId: String(r.id),
      createdAt: r.created_at,
      note: r.note,
      refundLineItems: done(
        (r.refund_line_items ?? []).map((rl: Rest) => ({
          id: `gid://shopify/RefundLineItem/${rl.id}`,
          quantity: rl.quantity,
          restockType: upper(rl.restock_type),
          lineItem: {
            id: `gid://shopify/LineItem/${rl.line_item_id}`,
            title: rl.line_item?.title,
          },
          subtotalSet: shop(rl.subtotal_set?.shop_money?.amount),
          totalTaxSet: shop(rl.total_tax_set?.shop_money?.amount),
        })),
      ),
      transactions: done(
        (r.transactions ?? []).map((t: Rest) => ({
          id: `gid://shopify/OrderTransaction/${t.id}`,
          kind: upper(t.kind),
          status: upper(t.status),
          amountSet: shop(t.amount),
        })),
      ),
    })),
    transactions,
    shippingLines: done([]),
    discountApplications: done([]),
  }
}

/** A GraphQL `orders` page body for REST fixtures; `transactionsById` keys on the REST id. */
export function ordersPageBody(
  orders: Rest[],
  transactionsById: ReadonlyMap<string, OrderTransactionLike[]> = new Map(),
  endCursor: string | null = null,
) {
  return {
    data: {
      orders: {
        nodes: orders.map((o) => restOrderAsGraphql(o, transactionsById.get(String(o.id)))),
        pageInfo: { hasNextPage: endCursor !== null, endCursor },
      },
    },
  }
}
