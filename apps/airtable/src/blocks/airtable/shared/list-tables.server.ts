// src/blocks/airtable/shared/list-tables.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { airtableApi, throwConnectionNotFound } from './airtable-api'

export default async function listTables(
  baseId: string,
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const response = await airtableApi('GET', `/meta/bases/${baseId}/tables`, connection.value)

  return (response.tables ?? []).map((table: any) => ({
    label: table.name,
    value: table.id,
  }))
}
