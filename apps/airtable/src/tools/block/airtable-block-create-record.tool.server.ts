// src/tools/block/airtable-block-create-record.tool.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { airtableApi, throwConnectionNotFound } from '../../blocks/airtable/shared/airtable-api'
import { parseFieldsJson } from './shared'

interface Input {
  baseId: string
  tableId: string
  fields: string
  typecast?: boolean | string
}

interface Output {
  recordId: string
  createdTime: string
  fields: Record<string, unknown>
}

export default async function airtableBlockCreateRecord(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const baseId = input.baseId?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'createBase', message: 'Select a base.' }])
  }
  const tableId = input.tableId?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'createTable', message: 'Select a table.' }])
  }

  const fields = parseFieldsJson(input.fields, 'createFields')
  const typecast = input.typecast === true || input.typecast === 'true'

  const result = await airtableApi('POST', `/${baseId}/${tableId}`, token, {
    body: {
      typecast,
      fields,
    },
  })

  return {
    recordId: result.id ?? '',
    createdTime: result.createdTime ?? '',
    fields: result.fields ?? {},
  }
}
