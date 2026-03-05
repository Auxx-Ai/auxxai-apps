import { getOrganizationConnection } from '@auxx/sdk/server'
import { quickbooksQuery } from './quickbooks-api'

export default async function listAccounts(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value || !connection?.metadata?.realmId) return []

  const accounts = await quickbooksQuery<any>(
    connection.metadata.realmId,
    'Account',
    connection.value,
    { returnAll: true },
  )

  return accounts.map((a: any) => ({
    value: a.Id,
    label: a.FullyQualifiedName || a.Name || `Account ${a.Id}`,
  }))
}
