// src/blocks/shopify/shared/list-collections.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import {
  shopifyApiGetAll,
  throwConnectionNotFound,
  getShopDomain,
  getShopifyToken,
} from './shopify-api'

export default async function listCollections(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  const token = getShopifyToken(connection)
  if (!token) throwConnectionNotFound()

  const shopDomain = getShopDomain(connection?.metadata)
  if (!shopDomain) return []

  const [custom, smart] = await Promise.all([
    shopifyApiGetAll<any>(shopDomain, token, '/custom_collections.json', 'custom_collections', {
      fields: 'id,title',
      limit: '250',
    }),
    shopifyApiGetAll<any>(shopDomain, token, '/smart_collections.json', 'smart_collections', {
      fields: 'id,title',
      limit: '250',
    }),
  ])

  const all = [...custom, ...smart]
  return all
    .map((c: any) => ({ value: String(c.id), label: c.title || String(c.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
