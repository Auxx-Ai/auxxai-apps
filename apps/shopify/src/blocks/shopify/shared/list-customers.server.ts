// src/blocks/shopify/shared/list-customers.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { shopifyApiGetAll, throwConnectionNotFound, getShopDomain } from './shopify-api'

export default async function listCustomers(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) return []

  const customers = await shopifyApiGetAll<any>(
    shopDomain,
    connection.value,
    '/customers.json',
    'customers',
    { fields: 'id,first_name,last_name,email', limit: '250' }
  )

  return customers
    .map((c: any) => {
      const name = `${c.first_name || ''} ${c.last_name || ''}`.trim()
      const label = c.email ? (name ? `${name} (${c.email})` : c.email) : name || String(c.id)
      return { value: String(c.id), label }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}
