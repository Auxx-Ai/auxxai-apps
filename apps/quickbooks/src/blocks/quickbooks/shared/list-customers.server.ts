import { getOrganizationConnection } from '@auxx/sdk/server'
import { quickbooksQuery } from './quickbooks-api'

export default async function listCustomers(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value || !connection?.metadata?.realmId) return []

  const customers = await quickbooksQuery<any>(
    connection.metadata.realmId,
    'Customer',
    connection.value,
    { returnAll: true },
  )

  return customers.map((c: any) => ({
    value: c.Id,
    label: c.DisplayName || `${c.GivenName ?? ''} ${c.FamilyName ?? ''}`.trim(),
  }))
}
