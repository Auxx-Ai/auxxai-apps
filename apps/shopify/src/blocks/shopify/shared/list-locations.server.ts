// src/blocks/shopify/shared/list-locations.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { shopifyApi, throwConnectionNotFound, getShopDomain } from './shopify-api'

export default async function listLocations(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) return []

  const result = await shopifyApi<{ locations: any[] }>(
    shopDomain,
    connection.value,
    '/locations.json'
  )

  return (result.locations || [])
    .map((loc: any) => ({ value: String(loc.id), label: loc.name || String(loc.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
