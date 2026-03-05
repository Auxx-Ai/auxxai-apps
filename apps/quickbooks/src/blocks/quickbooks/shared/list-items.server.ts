import { getOrganizationConnection } from '@auxx/sdk/server'
import { quickbooksQuery } from './quickbooks-api'

export default async function listItems(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value || !connection?.metadata?.realmId) return []

  const items = await quickbooksQuery<any>(
    connection.metadata.realmId,
    'Item',
    connection.value,
    { returnAll: true },
  )

  return items.map((item: any) => ({
    value: item.Id,
    label: item.Name || item.FullyQualifiedName || `Item ${item.Id}`,
  }))
}
