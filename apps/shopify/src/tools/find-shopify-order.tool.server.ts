// src/tools/find-shopify-order.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import { gidToNumeric } from './shared/map-customer'
import { mapOrderDetail, type OrderDetail } from './shared/map-order'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface FindShopifyOrderInput {
  query: string
}

interface FindShopifyOrderOutput {
  found: boolean
  order: OrderDetail | null
}

export default async function findShopifyOrder(
  input: FindShopifyOrderInput
): Promise<FindShopifyOrderOutput> {
  const { token, shopDomain } = getShopifyConnection()
  const raw = input.query.trim()

  // 1. GID — strip and fetch by id.
  if (raw.startsWith('gid://shopify/Order/')) {
    return await fetchById(shopDomain, token, gidToNumeric(raw))
  }

  // 2. Order name like "#1042" or "1042" — search by name (must include the #).
  const nameMatch = raw.match(/^#?(\d{1,})$/)
  if (nameMatch) {
    const name = `#${nameMatch[1]}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await shopifyApi<{ orders: any[] }>(shopDomain, token, '/orders.json', {
      qs: { name, status: 'any', limit: '1' },
    })
    const order = (result.orders ?? [])[0]
    if (order?.id) return await fetchById(shopDomain, token, order.id)
    return { found: false, order: null }
  }

  // 3. Email — return the most recent order placed by that email.
  if (raw.includes('@')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await shopifyApi<{ orders: any[] }>(shopDomain, token, '/orders.json', {
      qs: { email: raw, status: 'any', limit: '1', order: 'created_at desc' },
    })
    const order = (result.orders ?? [])[0]
    if (order?.id) return await fetchById(shopDomain, token, order.id)
    return { found: false, order: null }
  }

  // 4. Last-resort fallback — try GraphQL-style query via REST search.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await shopifyApi<{ orders: any[] }>(shopDomain, token, '/orders.json', {
    qs: { query: raw, status: 'any', limit: '1' },
  })
  const order = (result.orders ?? [])[0]
  if (order?.id) return await fetchById(shopDomain, token, order.id)
  return { found: false, order: null }
}

async function fetchById(
  shopDomain: string,
  token: string,
  numericId: number | string
): Promise<FindShopifyOrderOutput> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await shopifyApi<{ order: any }>(
    shopDomain,
    token,
    `/orders/${encodeURIComponent(String(numericId))}.json`
  )
  if (!result.order) return { found: false, order: null }
  const defaultCurrency = await getDefaultCurrency(shopDomain, token)
  const customerId = result.order.customer?.id
  const auxxRecordId = customerId ? await resolveContactRef(customerId) : null
  return { found: true, order: mapOrderDetail(result.order, defaultCurrency, auxxRecordId) }
}

async function getDefaultCurrency(shopDomain: string, token: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = await shopifyApi<{ shop: any }>(shopDomain, token, '/shop.json')
  return shop.shop?.currency ?? 'USD'
}
