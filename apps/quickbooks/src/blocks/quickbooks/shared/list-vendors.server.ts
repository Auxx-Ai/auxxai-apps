import { getOrganizationConnection } from '@auxx/sdk/server'
import { quickbooksQuery } from './quickbooks-api'

export default async function listVendors(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value || !connection?.metadata?.realmId) return []

  const vendors = await quickbooksQuery<any>(
    connection.metadata.realmId,
    'Vendor',
    connection.value,
    { returnAll: true },
  )

  return vendors.map((v: any) => ({
    value: v.Id,
    label: v.DisplayName || `${v.GivenName ?? ''} ${v.FamilyName ?? ''}`.trim(),
  }))
}
