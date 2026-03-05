import { getOrganizationConnection } from '@auxx/sdk/server'
import { contactsApiRequestAll } from './google-contacts-api'

export default async function listContactGroups(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) return []

  const groups = await contactsApiRequestAll(
    connection.value,
    'GET',
    '/contactGroups',
    undefined,
    undefined,
    'contactGroups'
  )

  return groups
    .map((g: any) => ({ value: g.resourceName, label: g.name || g.resourceName }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label))
}
