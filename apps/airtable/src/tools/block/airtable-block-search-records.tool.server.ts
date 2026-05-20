// src/tools/block/airtable-block-search-records.tool.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  airtablePaginatedGet,
  throwConnectionNotFound,
} from '../../blocks/airtable/shared/airtable-api'

interface Input {
  baseId: string
  tableId: string
  filterFormula?: string
  sortField?: string
  sortDirection?: string
  view?: string
  outputFields?: string
  returnAll?: boolean | string
  limit?: number | string
}

interface Output {
  records: any[]
  totalCount: string
  truncated: string
}

export default async function airtableBlockSearchRecords(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const baseId = input.baseId?.trim()
  if (!baseId) {
    throw new BlockValidationError([{ field: 'searchBase', message: 'Select a base.' }])
  }
  const tableId = input.tableId?.trim()
  if (!tableId) {
    throw new BlockValidationError([{ field: 'searchTable', message: 'Select a table.' }])
  }

  const params: Record<string, string> = {}

  const formula = input.filterFormula?.trim()
  if (formula) params.filterByFormula = formula

  const sortField = input.sortField?.trim()
  if (sortField) {
    const direction = input.sortDirection ?? 'asc'
    params['sort[0][field]'] = sortField
    params['sort[0][direction]'] = direction
  }

  const view = input.view?.trim()
  if (view) params.view = view

  const outputFields = input.outputFields?.trim()
  if (outputFields) {
    const fieldNames = outputFields
      .split(',')
      .map((f: string) => f.trim())
      .filter(Boolean)
    fieldNames.forEach((name: string, i: number) => {
      params[`fields[${i}]`] = name
    })
  }

  const returnAll = input.returnAll === true || input.returnAll === 'true'
  const limit = returnAll ? undefined : Number(input.limit) || 100

  const { records, truncated } = await airtablePaginatedGet(
    `/${baseId}/${tableId}`,
    token,
    params,
    { returnAll, limit }
  )

  return {
    records,
    totalCount: String(records.length),
    truncated: String(truncated),
  }
}
