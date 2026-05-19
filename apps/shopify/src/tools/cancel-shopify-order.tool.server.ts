// src/tools/cancel-shopify-order.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import { gidToNumeric, orderGid } from './shared/map-customer'

interface CancelShopifyOrderInput {
  shopifyOrderId: string
  reason?: 'customer' | 'inventory' | 'fraud' | 'declined' | 'other'
  refund?: boolean
  notifyCustomer?: boolean
  staffNote?: string
}

interface CancelShopifyOrderOutput {
  shopifyOrderId: string
  cancelledAt: string
  refunded: boolean
}

export default async function cancelShopifyOrder(
  input: CancelShopifyOrderInput
): Promise<CancelShopifyOrderOutput> {
  const { token, shopDomain } = getShopifyConnection()
  const numericId = gidToNumeric(input.shopifyOrderId)

  const body: Record<string, unknown> = {
    reason: input.reason ?? 'other',
    email: Boolean(input.notifyCustomer),
    refund: Boolean(input.refund),
  }
  if (input.staffNote) body.staff_note = input.staffNote

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await shopifyApi<{ order: any }>(
    shopDomain,
    token,
    `/orders/${encodeURIComponent(numericId)}/cancel.json`,
    { method: 'POST', body }
  )

  return {
    shopifyOrderId: orderGid(result.order?.id ?? numericId),
    cancelledAt: result.order?.cancelled_at ?? new Date().toISOString(),
    refunded: Boolean(input.refund),
  }
}
