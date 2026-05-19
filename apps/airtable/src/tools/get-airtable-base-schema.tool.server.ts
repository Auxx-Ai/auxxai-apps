// src/tools/get-airtable-base-schema.tool.server.ts

import { airtableApi } from '../blocks/airtable/shared/airtable-api'
import { getAirtableToken } from './shared/connection'
import { mapTable, type MappedAirtableTable } from './shared/map-table'

interface GetAirtableBaseSchemaInput {
  baseId: string
}

interface GetAirtableBaseSchemaOutput {
  baseId: string
  tables: MappedAirtableTable[]
}

export default async function getAirtableBaseSchema(
  input: GetAirtableBaseSchemaInput
): Promise<GetAirtableBaseSchemaOutput> {
  const token = getAirtableToken()

  const response = await airtableApi('GET', `/meta/bases/${input.baseId}/tables`, token)
  const tables = (response.tables ?? []).map(mapTable)

  return { baseId: input.baseId, tables }
}
