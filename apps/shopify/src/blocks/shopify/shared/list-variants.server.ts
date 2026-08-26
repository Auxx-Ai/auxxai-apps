// src/blocks/shopify/shared/list-variants.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { shopifyApi, throwConnectionNotFound, getShopDomain, getShopifyToken } from './shopify-api'

export default async function listVariants(
  productId: string
): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  const token = getShopifyToken(connection)
  if (!token) throwConnectionNotFound()

  const shopDomain = getShopDomain(connection?.metadata)
  if (!shopDomain || !productId) return []

  const result = await shopifyApi<{ variants: any[] }>(
    shopDomain,
    token,
    `/products/${productId}/variants.json`,
    { qs: { fields: 'id,title,sku', limit: '250' } }
  )

  return (result.variants || [])
    .map((v: any) => {
      const label = v.sku ? `${v.title || 'Variant'} (${v.sku})` : v.title || String(v.id)
      return { value: String(v.id), label }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}
