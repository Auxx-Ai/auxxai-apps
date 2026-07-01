// src/tools/cancel-shopify-order.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { withOrderId } from '../blocks/shopify/shared/resolve-order'
import { getShopifyConnection } from './shared/connection'
import { orderGid } from './shared/map-customer'

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

  const body: Record<string, unknown> = {
    reason: input.reason ?? 'other',
    email: Boolean(input.notifyCustomer),
    refund: Boolean(input.refund),
  }
  if (input.staffNote) body.staff_note = input.staffNote

  const result = await withOrderId(shopDomain, token, input.shopifyOrderId, (id) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shopifyApi<{ order: any }>(shopDomain, token, `/orders/${id}/cancel.json`, {
      method: 'POST',
      body,
    })
  )

  return {
    shopifyOrderId: orderGid(result.order?.id ?? input.shopifyOrderId),
    cancelledAt: result.order?.cancelled_at ?? new Date().toISOString(),
    refunded: Boolean(input.refund),
  }
}
