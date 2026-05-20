// src/tools/block/airtable-block-get-schema.tool.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { airtableApi, throwConnectionNotFound } from '../../blocks/airtable/shared/airtable-api'

interface Input {
  baseId: string
}

interface Output {
  tables: any[]
  tableCount: string
}

export default async function airtableBlockGetSchema(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const baseId = input.baseId?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'getSchemaBase', message: 'Select a base.' }])
  }

  const response = await airtableApi('GET', `/meta/bases/${baseId}/tables`, token)

  const tables = (response.tables ?? []).map((table: any) => ({
    id: table.id,
    name: table.name,
    fields: table.fields ?? [],
    views: table.views ?? [],
  }))

  return {
    tables,
    tableCount: String(tables.length),
  }
}
