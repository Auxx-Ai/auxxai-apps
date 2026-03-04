// src/blocks/airtable/resources/record/record-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  airtableApi,
  airtablePaginatedGet,
  throwConnectionNotFound,
} from '../../shared/airtable-api'

function parseFieldsJson(fieldsStr: string, fieldName: string): Record<string, string> {
  if (!fieldsStr?.trim()) return {}
  try {
    const parsed = JSON.parse(fieldsStr)
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object')
    }
    return parsed
  } catch {
    throw new BlockValidationError([
      {
        field: fieldName,
        message:
          'Fields must be a valid JSON object. Example: {"Name": "John", "Email": "john@acme.com"}',
      },
    ])
  }
}

export async function executeRecord(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'create':
      return createRecord(token, input)
    case 'delete':
      return deleteRecord(token, input)
    case 'get':
      return getRecord(token, input)
    case 'search':
      return searchRecords(token, input)
    case 'update':
      return updateRecord(token, input)
    case 'upsert':
      return upsertRecord(token, input)
    default:
      throw new Error(`Unknown record operation: ${operation}`)
  }
}

async function createRecord(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const baseId = input.createBase?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'createBase', message: 'Select a base.' }])
  }
  const tableId = input.createTable?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'createTable', message: 'Select a table.' }])
  }

  const fields = parseFieldsJson(input.createFields, 'createFields')
  const typecast = input.createTypecast === true || input.createTypecast === 'true'

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

async function deleteRecord(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const baseId = input.deleteBase?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'deleteBase', message: 'Select a base.' }])
  }
  const tableId = input.deleteTable?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'deleteTable', message: 'Select a table.' }])
  }
  const recordId = input.deleteRecordId?.trim()
  if (!recordId) {
    throw new BlockValidationError([{ field: 'deleteRecordId', message: 'Record ID is required.' }])
  }

  const result = await airtableApi('DELETE', `/${baseId}/${tableId}/${recordId}`, token)

  return {
    deletedRecordId: result.id ?? recordId,
    deleted: String(result.deleted ?? true),
  }
}

async function getRecord(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const baseId = input.getBase?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'getBase', message: 'Select a base.' }])
  }
  const tableId = input.getTable?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'getTable', message: 'Select a table.' }])
  }
  const recordId = input.getRecordId?.trim()
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

async function searchRecords(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const baseId = input.searchBase?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'searchBase', message: 'Select a base.' }])
  }
  const tableId = input.searchTable?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'searchTable', message: 'Select a table.' }])
  }

  const params: Record<string, string> = {}

  const formula = input.searchFilterFormula?.trim()
  if (formula) params.filterByFormula = formula

  const sortField = input.searchSortField?.trim()
  if (sortField) {
    const direction = input.searchSortDirection ?? 'asc'
    params['sort[0][field]'] = sortField
    params['sort[0][direction]'] = direction
  }

  const view = input.searchView?.trim()
  if (view) params.view = view

  const outputFields = input.searchOutputFields?.trim()
  if (outputFields) {
    const fieldNames = outputFields
      .split(',')
      .map((f: string) => f.trim())
      .filter(Boolean)
    fieldNames.forEach((name: string, i: number) => {
      params[`fields[${i}]`] = name
    })
  }

  const returnAll = input.searchReturnAll === true || input.searchReturnAll === 'true'
  const limit = returnAll ? undefined : Number(input.searchLimit) || 100

  const { records, truncated } = await airtablePaginatedGet(
    `/${baseId}/${tableId}`,
    token,
    params,
    { returnAll, limit }
  )

  return {
    records: records,
    totalCount: String(records.length),
    truncated: String(truncated),
  }
}

async function updateRecord(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const baseId = input.updateBase?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'updateBase', message: 'Select a base.' }])
  }
  const tableId = input.updateTable?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'updateTable', message: 'Select a table.' }])
  }
  const recordId = input.updateRecordId?.trim()
  if (!recordId) {
    throw new BlockValidationError([{ field: 'updateRecordId', message: 'Record ID is required.' }])
  }

  const fields = parseFieldsJson(input.updateFields, 'updateFields')
  const typecast = input.updateTypecast === true || input.updateTypecast === 'true'

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

async function upsertRecord(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const baseId = input.upsertBase?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'upsertBase', message: 'Select a base.' }])
  }
  const tableId = input.upsertTable?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'upsertTable', message: 'Select a table.' }])
  }

  const mergeFieldsStr = input.upsertMergeFields?.trim()
  if (!mergeFieldsStr) {
    throw new BlockValidationError([
      { field: 'upsertMergeFields', message: 'At least one merge field is required for upsert.' },
    ])
  }
  const fieldsToMergeOn = mergeFieldsStr
    .split(',')
    .map((f: string) => f.trim())
    .filter(Boolean)

  const fields = parseFieldsJson(input.upsertFields, 'upsertFields')
  const typecast = input.upsertTypecast === true || input.upsertTypecast === 'true'

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
