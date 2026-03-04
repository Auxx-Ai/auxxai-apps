// src/blocks/airtable/shared/list-fields.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { airtableApi, throwConnectionNotFound } from './airtable-api'
import { WRITABLE_FIELD_TYPES } from '../resources/constants'

/**
 * Fetch fields for a given table, optionally filtered to writable types only.
 */
export default async function listFields(
  baseId: string,
  tableId: string,
  { writableOnly = false }: { writableOnly?: boolean } = {}
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const response = await airtableApi('GET', `/meta/bases/${baseId}/tables`, connection.value)

  const table = (response.tables ?? []).find((t: any) => t.id === tableId)
  if (!table) return []

  const fields = (table.fields ?? []) as Array<{ id: string; name: string; type: string }>

  return fields
    .filter((f) => !writableOnly || WRITABLE_FIELD_TYPES.has(f.type))
    .map((f) => ({
      label: f.name,
      value: f.name,
    }))
}
