// src/tools/block/airtable-block-delete-record.tool.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { airtableApi, throwConnectionNotFound } from '../../blocks/airtable/shared/airtable-api'

interface Input {
  baseId: string
  tableId: string
  recordId: string
}

interface Output {
  deletedRecordId: string
  deleted: string
}

export default async function airtableBlockDeleteRecord(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const baseId = input.baseId?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'deleteBase', message: 'Select a base.' }])
  }
  const tableId = input.tableId?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'deleteTable', message: 'Select a table.' }])
  }
  const recordId = input.recordId?.trim()
  if (!recordId) {
    throw new BlockValidationError([
      { field: 'deleteRecordId', message: 'Record ID is required.' },
    ])
  }

  const result = await airtableApi('DELETE', `/${baseId}/${tableId}/${recordId}`, token)

  return {
    deletedRecordId: result.id ?? recordId,
    deleted: String(result.deleted ?? true),
  }
}
