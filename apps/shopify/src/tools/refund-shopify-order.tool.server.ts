// src/tools/refund-shopify-order.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import { gidToNumeric, orderGid } from './shared/map-customer'

interface RefundShopifyOrderInput {
  shopifyOrderId: string
  amount?: { amount: string; currencyCode: string }
  reason?: string
  restock?: boolean
  notifyCustomer?: boolean
}

interface RefundShopifyOrderOutput {
  refundId: string
  shopifyOrderId: string
  amount: { amount: string; currencyCode: string }
  createdAt: string
}

export default async function refundShopifyOrder(
  input: RefundShopifyOrderInput
): Promise<RefundShopifyOrderOutput> {
  const { token, shopDomain } = getShopifyConnection()
  const numericId = gidToNumeric(input.shopifyOrderId)

  // Pull the order so we know which transaction to refund against, plus the
  // order total to use when no explicit amount is provided.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderResult = await shopifyApi<{ order: any }>(
    shopDomain,
    token,
    `/orders/${encodeURIComponent(numericId)}.json`
  )
  const order = orderResult.order
  if (!order) {
    const err = new Error(`Order ${input.shopifyOrderId} not found.`) as Error & { code: string }
    err.code = 'NOT_FOUND'
    throw err
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txResult = await shopifyApi<{ transactions: any[] }>(
    shopDomain,
    token,
    `/orders/${encodeURIComponent(numericId)}/transactions.json`
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saleTx = (txResult.transactions ?? []).find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => (t.kind === 'sale' || t.kind === 'capture') && t.status === 'success'
  )
  if (!saleTx) {
    const err = new Error('Order has no settled sale transaction to refund.') as Error & {
      code: string
    }
    err.code = 'NO_SETTLED_TRANSACTION'
    throw err
  }

  const refundAmount = input.amount?.amount ?? String(order.total_price ?? '0.00')
  const currency = input.amount?.currencyCode ?? order.currency ?? 'USD'

  const body: Record<string, unknown> = {
    refund: {
      notify: Boolean(input.notifyCustomer),
      note: input.reason,
      shipping: {},
      transactions: [
        {
          parent_id: saleTx.id,
          amount: refundAmount,
          kind: 'refund',
          gateway: saleTx.gateway,
        },
      ],
      // Restock requires per-line-item info Shopify won't infer for us;
      // setting restock=true at the top level is a no-op for whole-order
      // refunds. Honour the flag for the LLM's intent and let the
      // workflow block handle precise line-item restocking.
      restock: Boolean(input.restock),
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await shopifyApi<{ refund: any }>(
    shopDomain,
    token,
    `/orders/${encodeURIComponent(numericId)}/refunds.json`,
    { method: 'POST', body }
  )

  const refund = result.refund ?? {}
  return {
    refundId: refund.id ? String(refund.id) : '',
    shopifyOrderId: orderGid(numericId),
    amount: { amount: refundAmount, currencyCode: currency },
    createdAt: refund.created_at ?? new Date().toISOString(),
  }
}
