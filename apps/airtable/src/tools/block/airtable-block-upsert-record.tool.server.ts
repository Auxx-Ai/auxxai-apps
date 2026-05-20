// src/tools/block/airtable-block-upsert-record.tool.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { airtableApi, throwConnectionNotFound } from '../../blocks/airtable/shared/airtable-api'
import { parseFieldsJson } from './shared'

interface Input {
  baseId: string
  tableId: string
  mergeFields: string
  fields: string
  typecast?: boolean | string
}

interface Output {
  recordId: string
  createdTime: string
  fields: Record<string, unknown>
  wasCreated: string
}

export default async function airtableBlockUpsertRecord(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const baseId = input.baseId?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'upsertBase', message: 'Select a base.' }])
  }
  const tableId = input.tableId?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'upsertTable', message: 'Select a table.' }])
  }

  const mergeFieldsStr = input.mergeFields?.trim()
  if (!mergeFieldsStr) {
    throw new BlockValidationError([
      { field: 'upsertMergeFields', message: 'At least one merge field is required for upsert.' },
    ])
  }
  const fieldsToMergeOn = mergeFieldsStr
    .split(',')
    .map((f: string) => f.trim())
    .filter(Boolean)

  const fields = parseFieldsJson(input.fields, 'upsertFields')
  const typecast = input.typecast === true || input.typecast === 'true'

  const result = await airtableApi('PATCH', `/${baseId}/${tableId}`, token, {
    body: {
      typecast,
      performUpsert: { fieldsToMergeOn },
      records: [{ fields }],
    },
  })

  const record = result.records?.[0]
  const createdRecords = result.createdRecords ?? []
  const wasCreated = createdRecords.includes(record?.id)

  return {
    recordId: record?.id ?? '',
    createdTime: record?.createdTime ?? '',
    fields: record?.fields ?? {},
    wasCreated: String(wasCreated),
  }
}
