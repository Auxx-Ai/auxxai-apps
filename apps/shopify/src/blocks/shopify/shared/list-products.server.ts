// src/blocks/shopify/shared/list-products.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { shopifyApiGetAll, throwConnectionNotFound, getShopDomain } from './shopify-api'

export default async function listProducts(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) return []

  const products = await shopifyApiGetAll<any>(
    shopDomain,
    connection.value,
    '/products.json',
    'products',
    { fields: 'id,title', limit: '250' }
  )

  return products
    .map((p: any) => ({ value: String(p.id), label: p.title || String(p.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
