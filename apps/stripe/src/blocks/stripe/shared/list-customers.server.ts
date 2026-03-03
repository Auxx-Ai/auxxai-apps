import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripePaginatedGet, throwConnectionNotFound } from './stripe-api'

export default async function listCustomers(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) {
    throwConnectionNotFound()
  }

  const apiKey = connection.value
  const { data } = await stripePaginatedGet(
    '/customers',
    apiKey,
    {},
    {
      returnAll: false,
      limit: 100,
    }
  )

  return data.map((c: any) => ({
    label: c.name || c.email || c.id,
    value: c.id,
  }))
}
