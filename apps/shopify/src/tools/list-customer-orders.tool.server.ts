// src/tools/list-customer-orders.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import { gidToNumeric } from './shared/map-customer'
import { mapOrderSummary, type OrderSummary } from './shared/map-order'

interface ListCustomerOrdersInput {
  shopifyCustomerId: string
  limit?: number
  status?: 'any' | 'open' | 'closed' | 'cancelled'
}

interface ListCustomerOrdersOutput {
  orders: OrderSummary[]
  truncated: boolean
}

export default async function listCustomerOrders(
  input: ListCustomerOrdersInput
): Promise<ListCustomerOrdersOutput> {
  const { token, shopDomain } = getShopifyConnection()
  const numericId = gidToNumeric(input.shopifyCustomerId)
  const limit = input.limit ?? 10
  const status = input.status ?? 'any'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await shopifyApi<{ orders: any[] }>(
    shopDomain,
    token,
    `/customers/${encodeURIComponent(numericId)}/orders.json`,
    {
      qs: {
        status,
        // +1 over the limit so we can flag truncation without a second roundtrip.
        limit: String(Math.min(limit + 1, 250)),
        order: 'created_at desc',
      },
    }
  )

  const defaultCurrency = await getDefaultCurrency(shopDomain, token)
  const all = result.orders ?? []
  const truncated = all.length > limit
  const orders = (truncated ? all.slice(0, limit) : all).map((o) =>
    mapOrderSummary(o, defaultCurrency)
  )

  return { orders, truncated }
}

async function getDefaultCurrency(shopDomain: string, token: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = await shopifyApi<{ shop: any }>(shopDomain, token, '/shop.json')
  return shop.shop?.currency ?? 'USD'
}
