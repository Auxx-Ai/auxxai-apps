// src/tools/block/airtable-block-update-record.tool.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { airtableApi, throwConnectionNotFound } from '../../blocks/airtable/shared/airtable-api'
import { parseFieldsJson } from './shared'

interface Input {
  baseId: string
  tableId: string
  recordId: string
  fields: string
  typecast?: boolean | string
}

interface Output {
  recordId: string
  fields: Record<string, unknown>
}

export default async function airtableBlockUpdateRecord(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const baseId = input.baseId?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'updateBase', message: 'Select a base.' }])
  }
  const tableId = input.tableId?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'updateTable', message: 'Select a table.' }])
  }
  const recordId = input.recordId?.trim()
  if (!recordId) {
    throw new BlockValidationError([
      { field: 'updateRecordId', message: 'Record ID is required.' },
    ])
  }

  const fields = parseFieldsJson(input.fields, 'updateFields')
  const typecast = input.typecast === true || input.typecast === 'true'

  const result = await airtableApi('PATCH', `/${baseId}/${tableId}`, token, {
    body: {
      typecast,
      records: [{ id: recordId, fields }],
    },
  })

  const updated = result.records?.[0]
  return {
    recordId: updated?.id ?? recordId,
    fields: updated?.fields ?? {},
  }
}
