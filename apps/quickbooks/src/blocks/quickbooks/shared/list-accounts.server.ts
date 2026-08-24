import { getOrganizationConnection } from '@auxx/sdk/server'
import { quickbooksQuery } from './quickbooks-api'

export default async function listAccounts(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value || !connection?.metadata?.realmId) return []

  const accounts = await quickbooksQuery<any>(
    connection.metadata.realmId,
    'Account',
    connection.value,
    { returnAll: true }
  )

  // Number first, because that is how a bookkeeper reads a chart of accounts:
  // "1200 Shopify Clearing", not "Shopify Clearing". Falls back to the name
  // alone when the company does not use account numbers.
  return accounts.map((a: any) => {
    const name = a.FullyQualifiedName || a.Name || `Account ${a.Id}`
    return {
      value: a.Id,
      label: a.AcctNum ? `${a.AcctNum} ${name}` : name,
    }
  })
}
