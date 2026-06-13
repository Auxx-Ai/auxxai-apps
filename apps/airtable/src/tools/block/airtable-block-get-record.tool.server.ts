// src/tools/block/airtable-block-get-record.tool.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { airtableApi, throwConnectionNotFound } from '../../blocks/airtable/shared/airtable-api'

interface Input {
  baseId: string
  tableId: string
  recordId: string
}

interface Output {
  recordId: string
  createdTime: string
  fields: Record<string, unknown>
}

export default async function airtableBlockGetRecord(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const baseId = input.baseId?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'getBase', message: 'Select a base.' }])
  }
  const tableId = input.tableId?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'getTable', message: 'Select a table.' }])
  }
  const recordId = input.recordId?.trim()
  if (!recordId) {
    throw new BlockValidationError([{ field: 'getRecordId', message: 'Record ID is required.' }])
  }

  const result = await airtableApi('GET', `/${baseId}/${tableId}/${recordId}`, token)

  return {
    recordId: result.id ?? '',
    createdTime: result.createdTime ?? '',
    fields: result.fields ?? {},
  }
}
