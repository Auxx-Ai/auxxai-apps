// src/graphql/order.ts

import {
  type OrderTransactionLike,
  type RawFulfillment,
  type RawOrder,
  type RawRefund,
  type RawTaxLine,
  resolvePaidTransaction,
} from '../shopify.connector.server'
import { type GraphqlPage, type ShopifyHttp, shopifyGraphql } from './client'
import type { GqlAddress } from './customer'
import { legacyId } from './legacy-id'
import type { GraphqlConnection } from './paged'

// ── query ──────────────────────────────────────────────────────────────────────

const PAGE_INFO = 'pageInfo { hasNextPage endCursor }'
const SHOP_MONEY = '{ shopMoney { amount } }'
const ADDRESS = '{ address1 address2 city province zip country }'
const TAX_LINE = `{ title rate priceSet ${SHOP_MONEY} channelLiable }`

const LINE_ITEM = `id title variantTitle sku vendor quantity unfulfilledQuantity taxable
  variant { legacyResourceId } product { legacyResourceId }
  originalUnitPriceSet ${SHOP_MONEY}
  taxLines ${TAX_LINE}
  discountAllocations { allocatedAmountSet ${SHOP_MONEY} }`
const FULFILLMENT_LINE = 'quantity lineItem { id sku variant { legacyResourceId } }'
const REFUND_LINE = `id quantity restockType lineItem { id title }
  subtotalSet ${SHOP_MONEY} totalTaxSet ${SHOP_MONEY}`
const REFUND_TRANSACTION = `id kind status amountSet ${SHOP_MONEY}`
// Today's PAID_TRANSACTIONS_QUERY selection, verbatim, so the payment resolvers see the same shape.
const TRANSACTION =
  'id kind status gateway processedAt amountSet { presentmentMoney { amount currencyCode } } settlementCurrency parentTransaction { id } paymentId test authorizationCode receiptJson'
const SHIPPING_LINE = `title code source originalPriceSet ${SHOP_MONEY}`
const DISCOUNT_APPLICATION = `__typename allocationMethod targetSelection targetType
  value { __typename ... on MoneyV2 { amount } ... on PricingPercentageValue { percentage } }
  ... on DiscountCodeApplication { code }
  ... on ManualDiscountApplication { title }
  ... on ScriptDiscountApplication { title }
  ... on AutomaticDiscountApplication { title }`

const FULFILLMENT = `id legacyResourceId name status displayStatus createdAt updatedAt
  trackingInfo { number company url } location { legacyResourceId }
  fulfillmentLineItems(first: 50) { ${PAGE_INFO} nodes { ${FULFILLMENT_LINE} } }`
const REFUND = `id legacyResourceId createdAt note
  refundLineItems(first: 50) { ${PAGE_INFO} nodes { ${REFUND_LINE} } }
  transactions(first: 20) { ${PAGE_INFO} nodes { ${REFUND_TRANSACTION} } }`

/** Orders per page (plan §6.2: requested cost 662 at 25 with the nested caps below). */
export const ORDERS_FIRST = 25
/** Caps of the plain (un-paged) lists on the page query; a list this long is re-queried. */
export const ORDER_LIST_FIRST = { fulfillments: 50, refunds: 50, transactions: 50 } as const
/** The most a plain list can be asked for; still full at this size throws. */
export const ORDER_LIST_MAX = 250
/** Page size of a nested-connection follow-up. */
const FOLLOW_UP_FIRST = 100

/** Orders page, oldest update first (plan §6.2). No `paymentTerms`: see D9. */
export const ORDERS_QUERY = `query OrdersPage($first: Int!, $after: String, $query: String) {
  orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
    ${PAGE_INFO}
    nodes {
      id legacyResourceId name number email currencyCode
      createdAt updatedAt processedAt cancelledAt cancelReason note tags
      displayFinancialStatus displayFulfillmentStatus paymentGatewayNames
      totalPriceSet ${SHOP_MONEY} subtotalPriceSet ${SHOP_MONEY}
      totalTaxSet ${SHOP_MONEY} totalDiscountsSet ${SHOP_MONEY}
      totalShippingPriceSet ${SHOP_MONEY}
      shippingAddress ${ADDRESS} billingAddress ${ADDRESS}
      customer { legacyResourceId firstName lastName taxExempt defaultEmailAddress { emailAddress } }
      taxLines ${TAX_LINE}
      lineItems(first: 50) { ${PAGE_INFO} nodes { ${LINE_ITEM} } }
      fulfillments(first: ${ORDER_LIST_FIRST.fulfillments}) { ${FULFILLMENT} }
      refunds(first: ${ORDER_LIST_FIRST.refunds}) { ${REFUND} }
      transactions(first: ${ORDER_LIST_FIRST.transactions}) { ${TRANSACTION} }
      shippingLines(first: 20) { ${PAGE_INFO} nodes { ${SHIPPING_LINE} } }
      discountApplications(first: 20) { ${PAGE_INFO} nodes { ${DISCOUNT_APPLICATION} } }
    }
  }
}`

// ── GraphQL shapes ─────────────────────────────────────────────────────────────

interface GqlMoney {
  shopMoney?: { amount?: string | null } | null
}

interface GqlTaxLine {
  title?: string | null
  rate?: number | null
  priceSet?: GqlMoney | null
  channelLiable?: boolean | null
}

export interface GqlLineItem {
  id: string
  title?: string | null
  variantTitle?: string | null
  sku?: string | null
  vendor?: string | null
  quantity: number
  unfulfilledQuantity: number
  taxable?: boolean | null
  variant?: { legacyResourceId: string } | null
  product?: { legacyResourceId: string } | null
  originalUnitPriceSet?: GqlMoney | null
  taxLines?: GqlTaxLine[] | null
  discountAllocations?: Array<{ allocatedAmountSet?: GqlMoney | null }> | null
}

export interface GqlFulfillmentLine {
  quantity?: number | null
  lineItem?: {
    id: string
    sku?: string | null
    variant?: { legacyResourceId: string } | null
  } | null
}

export interface GqlFulfillment {
  id: string
  legacyResourceId: string
  name?: string | null
  status: string
  displayStatus?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  trackingInfo?: Array<{
    number?: string | null
    company?: string | null
    url?: string | null
  }> | null
  location?: { legacyResourceId: string } | null
  fulfillmentLineItems: GraphqlConnection<GqlFulfillmentLine>
}

export interface GqlRefundLine {
  id: string
  quantity?: number | null
  restockType?: string | null
  lineItem?: { id: string; title?: string | null } | null
  subtotalSet?: GqlMoney | null
  totalTaxSet?: GqlMoney | null
}

export interface GqlRefundTransaction {
  id: string
  kind?: string | null
  status?: string | null
  amountSet?: GqlMoney | null
}

export interface GqlRefund {
  id: string
  legacyResourceId: string
  createdAt?: string | null
  note?: string | null
  refundLineItems: GraphqlConnection<GqlRefundLine>
  transactions: GraphqlConnection<GqlRefundTransaction>
}

export interface GqlShippingLine {
  title?: string | null
  code?: string | null
  source?: string | null
  originalPriceSet?: GqlMoney | null
}

export interface GqlDiscountApplication {
  __typename: string
  allocationMethod?: string | null
  targetSelection?: string | null
  targetType?: string | null
  value?: { __typename: string; amount?: string | null; percentage?: number | null } | null
  code?: string | null
  title?: string | null
}

export interface GqlOrder {
  id: string
  legacyResourceId: string
  name?: string | null
  number?: number | null
  email?: string | null
  currencyCode?: string | null
  createdAt: string
  updatedAt: string
  processedAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  note?: string | null
  tags?: string[] | null
  displayFinancialStatus?: string | null
  displayFulfillmentStatus: string
  paymentGatewayNames?: string[] | null
  totalPriceSet?: GqlMoney | null
  subtotalPriceSet?: GqlMoney | null
  totalTaxSet?: GqlMoney | null
  totalDiscountsSet?: GqlMoney | null
  totalShippingPriceSet?: GqlMoney | null
  shippingAddress?: GqlAddress | null
  billingAddress?: GqlAddress | null
  customer?: {
    legacyResourceId: string
    firstName?: string | null
    lastName?: string | null
    taxExempt?: boolean | null
    defaultEmailAddress?: { emailAddress?: string | null } | null
  } | null
  taxLines?: GqlTaxLine[] | null
  lineItems: GraphqlConnection<GqlLineItem>
  fulfillments: GqlFulfillment[]
  refunds: GqlRefund[]
  transactions: OrderTransactionLike[]
  shippingLines: GraphqlConnection<GqlShippingLine>
  discountApplications: GraphqlConnection<GqlDiscountApplication>
}

export interface OrdersData {
  orders: GraphqlConnection<GqlOrder>
}

/** The REST order plus its inline transactions, which `toOrderRecord` takes separately. */
export type RawOrderWithTransactions = RawOrder & { transactions: OrderTransactionLike[] }

// ── no silent truncation ───────────────────────────────────────────────────────

type ListKey = keyof typeof ORDER_LIST_FIRST
const LIST_SELECTION: Record<ListKey, string> = {
  fulfillments: FULFILLMENT,
  refunds: REFUND,
  transactions: TRANSACTION,
}

/** Re-query one plain list at its maximum; throws if it is still full. */
async function requeryList<K extends ListKey>(
  http: ShopifyHttp,
  orderId: string,
  key: K,
): Promise<GraphqlPage<GqlOrder[K]>> {
  const query = `query OrderList($id: ID!) { order(id: $id) { ${key}(first: ${ORDER_LIST_MAX}) { ${LIST_SELECTION[key]} } } }`
  const res = await shopifyGraphql<{ order: Pick<GqlOrder, K> | null }>(http, query, {
    id: orderId,
  })
  if (!res.ok) return res
  const list = res.data.order?.[key]
  if (!Array.isArray(list)) throw new Error(`shopify: order ${orderId} vanished re-querying ${key}`)
  if (list.length >= ORDER_LIST_MAX)
    throw new Error(`shopify: order ${orderId} has ${ORDER_LIST_MAX}+ ${key}; refusing to truncate`)
  return { ok: true, data: list as GqlOrder[K] }
}

/** Page the rest of a nested connection; `wrap` places the connection selection under `$id`. */
async function drainConnection<N>(
  http: ShopifyHttp,
  conn: GraphqlConnection<N>,
  id: string,
  field: string,
  fields: string,
  wrap: (connection: string) => string,
  pick: (data: Record<string, unknown>) => GraphqlConnection<N> | null | undefined,
): Promise<GraphqlPage<GraphqlConnection<N>>> {
  const selection = `${field}(first: ${FOLLOW_UP_FIRST}, after: $after) { ${PAGE_INFO} nodes { ${fields} } }`
  const query = `query FollowUp($id: ID!, $after: String) { ${wrap(selection)} }`
  const nodes = [...conn.nodes]
  let { hasNextPage, endCursor } = conn.pageInfo
  while (hasNextPage) {
    if (!endCursor) throw new Error(`shopify: ${id} ${field} has a next page but no cursor`)
    const res = await shopifyGraphql<Record<string, unknown>>(http, query, { id, after: endCursor })
    if (!res.ok) return res
    const next = pick(res.data)
    if (!next) throw new Error(`shopify: ${id} vanished paging ${field}`)
    nodes.push(...next.nodes)
    ;({ hasNextPage, endCursor } = next.pageInfo)
  }
  return { ok: true, data: { nodes, pageInfo: { hasNextPage: false, endCursor } } }
}

type Picked<N> = GraphqlConnection<N> | null | undefined

/** A follow-up for a connection directly on the order. */
const orderConnection =
  <N>(field: string, fields: string) =>
  (http: ShopifyHttp, conn: GraphqlConnection<N>, id: string) =>
    drainConnection(
      http,
      conn,
      id,
      field,
      fields,
      (selection) => `order(id: $id) { ${selection} }`,
      (data) => (data.order as Record<string, Picked<N>> | null)?.[field],
    )

/** A follow-up for a connection under a plain-list element (fulfillment, refund). */
const nodeConnection =
  <N>(type: string, field: string, fields: string) =>
  (http: ShopifyHttp, conn: GraphqlConnection<N>, id: string) =>
    drainConnection(
      http,
      conn,
      id,
      field,
      fields,
      (selection) => `node(id: $id) { ... on ${type} { ${selection} } }`,
      (data) => (data.node as Record<string, Picked<N>> | null)?.[field],
    )

const drainLineItems = orderConnection<GqlLineItem>('lineItems', LINE_ITEM)
const drainShippingLines = orderConnection<GqlShippingLine>('shippingLines', SHIPPING_LINE)
const drainDiscounts = orderConnection<GqlDiscountApplication>(
  'discountApplications',
  DISCOUNT_APPLICATION,
)
const drainFulfillmentLines = nodeConnection<GqlFulfillmentLine>(
  'Fulfillment',
  'fulfillmentLineItems',
  FULFILLMENT_LINE,
)
const drainRefundLines = nodeConnection<GqlRefundLine>('Refund', 'refundLineItems', REFUND_LINE)
const drainRefundTransactions = nodeConnection<GqlRefundTransaction>(
  'Refund',
  'transactions',
  REFUND_TRANSACTION,
)

/** Fetch whatever the page query cut off for one order, so it is never projected truncated. */
async function completeOrder(http: ShopifyHttp, input: GqlOrder): Promise<GraphqlPage<GqlOrder>> {
  const order = { ...input }
  for (const key of Object.keys(ORDER_LIST_FIRST) as ListKey[]) {
    if (order[key].length < ORDER_LIST_FIRST[key]) continue
    const res = await requeryList(http, order.id, key)
    if (!res.ok) return res
    ;(order as Record<ListKey, unknown>)[key] = res.data
  }

  const lineItems = await drainLineItems(http, order.lineItems, order.id)
  if (!lineItems.ok) return lineItems
  const shippingLines = await drainShippingLines(http, order.shippingLines, order.id)
  if (!shippingLines.ok) return shippingLines
  const discounts = await drainDiscounts(http, order.discountApplications, order.id)
  if (!discounts.ok) return discounts
  order.lineItems = lineItems.data
  order.shippingLines = shippingLines.data
  order.discountApplications = discounts.data

  const fulfillments: GqlFulfillment[] = []
  for (const f of order.fulfillments) {
    const lines = await drainFulfillmentLines(http, f.fulfillmentLineItems, f.id)
    if (!lines.ok) return lines
    fulfillments.push({ ...f, fulfillmentLineItems: lines.data })
  }
  const refunds: GqlRefund[] = []
  for (const r of order.refunds) {
    const lines = await drainRefundLines(http, r.refundLineItems, r.id)
    if (!lines.ok) return lines
    const transactions = await drainRefundTransactions(http, r.transactions, r.id)
    if (!transactions.ok) return transactions
    refunds.push({ ...r, refundLineItems: lines.data, transactions: transactions.data })
  }
  order.fulfillments = fulfillments
  order.refunds = refunds
  return { ok: true, data: order }
}

/** `fetchGraphqlPage`'s `complete` hook: any throttle retries the whole page. */
export async function completeOrders(
  nodes: GqlOrder[],
  http: ShopifyHttp,
): Promise<GraphqlPage<GqlOrder[]>> {
  const out: GqlOrder[] = []
  for (const node of nodes) {
    const res = await completeOrder(http, node)
    if (!res.ok) return res
    out.push(res.data)
  }
  return { ok: true, data: out }
}

// ── enum tables (plan §6.2) — an unknown value throws, never passes through ────

type EnumTable = Readonly<Record<string, string | null>>

const lowercased = (values: string[], overrides: EnumTable = {}): EnumTable => ({
  ...Object.fromEntries(values.map((v) => [v, v.toLowerCase()])),
  ...overrides,
})

export const FINANCIAL_STATUS = lowercased([
  'PENDING',
  'AUTHORIZED',
  'PARTIALLY_PAID',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'VOIDED',
  'EXPIRED',
])
// Unobserved values (PENDING_FULFILLMENT, OPEN, IN_PROGRESS, ON_HOLD, ...) throw until seen against REST.
export const ORDER_FULFILLMENT_STATUS: EnumTable = {
  UNFULFILLED: null,
  FULFILLED: 'fulfilled',
  PARTIALLY_FULFILLED: 'partial',
  RESTOCKED: 'restocked',
}
export const CANCEL_REASON = lowercased([
  'CUSTOMER',
  'DECLINED',
  'FRAUD',
  'INVENTORY',
  'OTHER',
  'STAFF',
])
export const RESTOCK_TYPE = lowercased(['CANCEL', 'RETURN', 'NO_RESTOCK', 'LEGACY_RESTOCK'])
export const FULFILLMENT_STATUS = lowercased([
  'SUCCESS',
  'CANCELLED',
  'ERROR',
  'FAILURE',
  'PENDING',
  'OPEN',
])
export const SHIPMENT_STATUS = lowercased(
  [
    'ATTEMPTED_DELIVERY',
    'CANCELED',
    'CARRIER_PICKED_UP',
    'CONFIRMED',
    'DELAYED',
    'DELIVERED',
    'FAILURE',
    'IN_TRANSIT',
    'LABEL_PRINTED',
    'LABEL_PURCHASED',
    'LABEL_VOIDED',
    'MARKED_AS_FULFILLED',
    'OUT_FOR_DELIVERY',
    'PICKED_UP',
    'READY_FOR_PICKUP',
    'SUBMITTED',
  ],
  { FULFILLED: null, NOT_DELIVERED: 'failure' },
)
export const TRANSACTION_KIND = lowercased([
  'AUTHORIZATION',
  'CAPTURE',
  'CHANGE',
  'EMV_AUTHORIZATION',
  'REFUND',
  'SALE',
  'SUGGESTED_REFUND',
  'VOID',
])
// AWAITING_RESPONSE / UNKNOWN have no REST spelling; `moneyPending` would misread them.
export const TRANSACTION_STATUS = lowercased(['SUCCESS', 'FAILURE', 'PENDING', 'ERROR'])
const DISCOUNT_TYPE: EnumTable = {
  DiscountCodeApplication: 'discount_code',
  ManualDiscountApplication: 'manual',
  ScriptDiscountApplication: 'script',
  AutomaticDiscountApplication: 'automatic',
}
const ALLOCATION_METHOD = lowercased(['ACROSS', 'EACH', 'ONE'])
const TARGET_SELECTION = lowercased(['ALL', 'ENTITLED', 'EXPLICIT'])
const TARGET_TYPE = lowercased(['LINE_ITEM', 'SHIPPING_LINE'])

function mapEnum(table: EnumTable, value: string | null | undefined, label: string) {
  if (value == null) return null
  if (!Object.prototype.hasOwnProperty.call(table, value))
    throw new Error(`shopify: unknown ${label} "${value}"`)
  return table[value] ?? null
}

// ── adapter ────────────────────────────────────────────────────────────────────

const GID_TAIL_TYPES = ['LineItem', 'RefundLineItem', 'OrderTransaction'] as const

/** Numeric id from a gid, for the types with no `legacyResourceId` (plan §6.2). */
export function gidTail(gid: unknown, type: (typeof GID_TAIL_TYPES)[number]): number {
  const match =
    typeof gid === 'string' ? new RegExp(`^gid://shopify/${type}/(\\d+)$`).exec(gid) : null
  if (!match) throw new Error(`shopify: expected a ${type} gid, got ${String(gid)}`)
  return legacyId(match[1])
}

const money = (set: GqlMoney | null | undefined) => set?.shopMoney?.amount ?? null
const optionalId = (ref: { legacyResourceId: string } | null | undefined) =>
  ref ? legacyId(ref.legacyResourceId) : null

function complete<N>(conn: GraphqlConnection<N>, label: string): N[] {
  if (conn.pageInfo.hasNextPage) throw new Error(`shopify: ${label} is truncated`)
  return conn.nodes
}

function toRawTaxLine(tl: GqlTaxLine): RawTaxLine {
  return {
    title: tl.title ?? null,
    rate: tl.rate ?? null,
    price_set: { shop_money: { amount: money(tl.priceSet) } },
    channel_liable: tl.channelLiable ?? null,
  }
}

function toRawAddress(addr: GqlAddress | null | undefined) {
  if (!addr) return null
  return {
    address1: addr.address1 ?? null,
    address2: addr.address2 ?? null,
    city: addr.city ?? null,
    province: addr.province ?? null,
    zip: addr.zip ?? null,
    country: addr.country ?? null,
  }
}

/** REST line `fulfillment_status`, derived from quantities (the GraphQL field is deprecated). */
function lineFulfillmentStatus(li: GqlLineItem): string | null {
  if (li.unfulfilledQuantity === 0) return 'fulfilled'
  if (li.unfulfilledQuantity === li.quantity) return null
  return 'partial'
}

function toRawFulfillment(f: GqlFulfillment): RawFulfillment {
  const tracking = f.trackingInfo?.[0]
  return {
    id: legacyId(f.legacyResourceId),
    name: f.name ?? null,
    status: mapEnum(FULFILLMENT_STATUS, f.status, 'fulfillment status'),
    shipment_status: mapEnum(SHIPMENT_STATUS, f.displayStatus, 'fulfillment displayStatus'),
    created_at: f.createdAt ?? null,
    updated_at: f.updatedAt ?? null,
    tracking_number: tracking?.number ?? null,
    tracking_company: tracking?.company ?? null,
    tracking_url: tracking?.url ?? null,
    location_id: optionalId(f.location),
    line_items: complete(f.fulfillmentLineItems, 'fulfillmentLineItems').map((fl) => ({
      // REST's fulfillment line `id` is the ORDER line item's id.
      id: fl.lineItem ? gidTail(fl.lineItem.id, 'LineItem') : null,
      variant_id: optionalId(fl.lineItem?.variant),
      sku: fl.lineItem?.sku ?? null,
      quantity: fl.quantity ?? null,
    })),
  }
}

function toRawRefund(r: GqlRefund): RawRefund {
  return {
    id: legacyId(r.legacyResourceId),
    created_at: r.createdAt ?? null,
    note: r.note ?? null,
    refund_line_items: complete(r.refundLineItems, 'refundLineItems').map((rl) => ({
      id: gidTail(rl.id, 'RefundLineItem'),
      line_item_id: rl.lineItem ? gidTail(rl.lineItem.id, 'LineItem') : null,
      line_item: rl.lineItem ? { title: rl.lineItem.title ?? null } : null,
      quantity: rl.quantity ?? null,
      subtotal_set: { shop_money: { amount: money(rl.subtotalSet) } },
      total_tax_set: { shop_money: { amount: money(rl.totalTaxSet) } },
      restock_type: mapEnum(RESTOCK_TYPE, rl.restockType, 'refund restockType'),
    })),
    transactions: complete(r.transactions, 'refund transactions').map((t) => ({
      id: gidTail(t.id, 'OrderTransaction'),
      kind: mapEnum(TRANSACTION_KIND, t.kind, 'transaction kind'),
      status: mapEnum(TRANSACTION_STATUS, t.status, 'transaction status'),
      amount: money(t.amountSet),
    })),
  }
}

function toRawDiscountApplication(d: GqlDiscountApplication) {
  const percentage = d.value?.__typename === 'PricingPercentageValue'
  return {
    type: mapEnum(DISCOUNT_TYPE, d.__typename, 'discount application type'),
    value: percentage ? String(d.value?.percentage ?? '') : (d.value?.amount ?? null),
    value_type: percentage ? 'percentage' : 'fixed_amount',
    allocation_method: mapEnum(ALLOCATION_METHOD, d.allocationMethod, 'allocationMethod'),
    target_selection: mapEnum(TARGET_SELECTION, d.targetSelection, 'targetSelection'),
    target_type: mapEnum(TARGET_TYPE, d.targetType, 'targetType'),
    ...(d.code != null ? { code: d.code } : {}),
    ...(d.title != null ? { title: d.title } : {}),
  }
}

/**
 * D9: REST's `payment_terms` needs `read_payment_terms`, which we do not hold. Mark the
 * order "paid later" when its latest successful sale/capture postdates `processedAt`.
 */
function inferredPaymentTerms(node: GqlOrder): RawOrder['payment_terms'] {
  const paidAt = resolvePaidTransaction(node.transactions)?.paidAt
  const paidMs = paidAt ? Date.parse(paidAt) : Number.NaN
  const processedMs = node.processedAt ? Date.parse(node.processedAt) : Number.NaN
  return paidMs > processedMs ? { payment_terms_name: null } : null
}

/** Adapt a completed GraphQL order into the REST shape `toOrderRecord` projects (plan §3.1). */
export function toRawOrder(node: GqlOrder): RawOrderWithTransactions {
  if (node.transactions.length >= ORDER_LIST_MAX)
    throw new Error('shopify: order transactions are truncated')
  return {
    id: legacyId(node.legacyResourceId),
    name: node.name ?? null,
    order_number: node.number ?? undefined,
    email: node.email ?? null,
    currency: node.currencyCode ?? null,
    total_price: money(node.totalPriceSet),
    subtotal_price: money(node.subtotalPriceSet),
    total_tax: money(node.totalTaxSet),
    total_discounts: money(node.totalDiscountsSet),
    total_shipping_price_set: node.totalShippingPriceSet
      ? { shop_money: { amount: money(node.totalShippingPriceSet) } }
      : null,
    financial_status: mapEnum(FINANCIAL_STATUS, node.displayFinancialStatus, 'financial status'),
    fulfillment_status: mapEnum(
      ORDER_FULFILLMENT_STATUS,
      node.displayFulfillmentStatus,
      'fulfillment status',
    ),
    cancel_reason: mapEnum(CANCEL_REASON, node.cancelReason, 'cancel reason'),
    payment_gateway_names: node.paymentGatewayNames ?? [],
    payment_terms: inferredPaymentTerms(node),
    tags: (node.tags ?? []).join(', '),
    note: node.note ?? null,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    processed_at: node.processedAt ?? null,
    cancelled_at: node.cancelledAt ?? null,
    fulfillments: node.fulfillments.map(toRawFulfillment),
    shipping_address: toRawAddress(node.shippingAddress),
    billing_address: toRawAddress(node.billingAddress),
    customer: node.customer
      ? {
          id: legacyId(node.customer.legacyResourceId),
          email: node.customer.defaultEmailAddress?.emailAddress ?? null,
          first_name: node.customer.firstName ?? null,
          last_name: node.customer.lastName ?? null,
          tax_exempt: node.customer.taxExempt ?? null,
        }
      : null,
    line_items: complete(node.lineItems, 'lineItems').map((li) => ({
      id: gidTail(li.id, 'LineItem'),
      title: li.title ?? null,
      variant_title: li.variantTitle ?? null,
      variant_id: optionalId(li.variant),
      sku: li.sku ?? null,
      vendor: li.vendor ?? null,
      quantity: li.quantity,
      fulfillable_quantity: li.unfulfilledQuantity,
      price: money(li.originalUnitPriceSet),
      fulfillment_status: lineFulfillmentStatus(li),
      product_id: optionalId(li.product),
      taxable: li.taxable ?? null,
      tax_lines: (li.taxLines ?? []).map(toRawTaxLine),
      discount_allocations: (li.discountAllocations ?? []).map((a) => ({
        amount: money(a.allocatedAmountSet),
      })),
    })),
    refunds: node.refunds.map(toRawRefund),
    tax_lines: (node.taxLines ?? []).map(toRawTaxLine),
    shipping_lines: complete(node.shippingLines, 'shippingLines').map((sl) => ({
      title: sl.title ?? null,
      code: sl.code ?? null,
      source: sl.source ?? null,
      price: money(sl.originalPriceSet),
      price_set: { shop_money: { amount: money(sl.originalPriceSet) } },
    })),
    discount_applications: complete(node.discountApplications, 'discountApplications').map(
      toRawDiscountApplication,
    ),
    transactions: node.transactions,
  }
}
