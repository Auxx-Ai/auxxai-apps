// src/blocks/shopify/shared/list-collections.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { shopifyApiGetAll, throwConnectionNotFound, getShopDomain } from './shopify-api'

export default async function listCollections(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) return []

  const [custom, smart] = await Promise.all([
    shopifyApiGetAll<any>(
      shopDomain,
      connection.value,
      '/custom_collections.json',
      'custom_collections',
      { fields: 'id,title', limit: '250' }
    ),
    shopifyApiGetAll<any>(
      shopDomain,
      connection.value,
      '/smart_collections.json',
      'smart_collections',
      { fields: 'id,title', limit: '250' }
    ),
  ])

  const all = [...custom, ...smart]
  return all
    .map((c: any) => ({ value: String(c.id), label: c.title || String(c.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
