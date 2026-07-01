// src/tools/get-shopify-order.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { withOrderId } from '../blocks/shopify/shared/resolve-order'
import { getShopifyConnection } from './shared/connection'
import { mapOrderDetail, type OrderDetail } from './shared/map-order'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface GetShopifyOrderInput {
  shopifyOrderId: string
}

export default async function getShopifyOrder(input: GetShopifyOrderInput): Promise<OrderDetail> {
  const { token, shopDomain } = getShopifyConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await withOrderId(shopDomain, token, input.shopifyOrderId, (id) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shopifyApi<{ order: any }>(shopDomain, token, `/orders/${id}.json`)
  )
  if (!result.order) {
    const err = new Error(`Order ${input.shopifyOrderId} not found.`) as Error & { code: string }
    err.code = 'NOT_FOUND'
    throw err
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = await shopifyApi<{ shop: any }>(shopDomain, token, '/shop.json')
  const defaultCurrency = shop.shop?.currency ?? 'USD'

  const customerId = result.order.customer?.id
  const auxxRecordId = customerId ? await resolveContactRef(customerId) : null
  return mapOrderDetail(result.order, defaultCurrency, auxxRecordId)
}
