// src/blocks/shopify/shared/list-price-rules.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { shopifyApiGetAll, throwConnectionNotFound, getShopDomain } from './shopify-api'

export default async function listPriceRules(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) return []

  const rules = await shopifyApiGetAll<any>(
    shopDomain,
    connection.value,
    '/price_rules.json',
    'price_rules',
    { limit: '250' }
  )

  return rules
    .map((r: any) => ({ value: String(r.id), label: r.title || String(r.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
