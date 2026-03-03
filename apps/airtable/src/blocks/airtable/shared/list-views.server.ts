// src/blocks/airtable/shared/list-views.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { airtableApi, throwConnectionNotFound } from './airtable-api'

export default async function listViews(
  baseId: string,
  tableId: string
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const response = await airtableApi('GET', `/meta/bases/${baseId}/tables`, connection.value)

  const table = (response.tables ?? []).find((t: any) => t.id === tableId)
  if (!table) return []

  return (table.views ?? []).map((v: any) => ({
    label: v.name,
    value: v.id,
  }))
}
