// src/tools/search-airtable-records.tool.server.ts

import { airtablePaginatedGet } from '../blocks/airtable/shared/airtable-api'
import { compileFilters, type Filter } from './shared/compile-filter'
import { getAirtableToken } from './shared/connection'
import { mapRecord, type MappedAirtableRecord } from './shared/map-record'

interface SearchAirtableRecordsInput {
  baseId: string
  tableId: string
  filters?: Filter[]
  viewId?: string
  sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>
  limit?: number
  fields?: string[]
}

interface SearchAirtableRecordsOutput {
  records: MappedAirtableRecord[]
  truncated: boolean
  baseId: string
  tableId: string
}

export default async function searchAirtableRecords(
  input: SearchAirtableRecordsInput
): Promise<SearchAirtableRecordsOutput> {
  const filters = input.filters ?? []
  for (const f of filters) {
    if ((f.op === 'isEmpty' || f.op === 'isNotEmpty') && f.value != null) {
      const err = new Error('isEmpty/isNotEmpty filters must not include value.') as Error & {
        code: string
      }
      err.code = 'INVALID_INPUT'
      throw err
    }
    if (f.op !== 'isEmpty' && f.op !== 'isNotEmpty' && f.value == null) {
      const err = new Error(`Filter op '${f.op}' requires a value.`) as Error & { code: string }
      err.code = 'INVALID_INPUT'
      throw err
    }
  }

  const token = getAirtableToken()
  const limit = input.limit ?? 25

  const params: Record<string, string> = {}
  const formula = compileFilters(filters)
  if (formula) params.filterByFormula = formula
  if (input.viewId) params.view = input.viewId
  params.maxRecords = String(limit)

  input.sort?.forEach((s, i) => {
    params[`sort[${i}][field]`] = s.field
    if (s.direction) params[`sort[${i}][direction]`] = s.direction
  })
  input.fields?.forEach((name, i) => {
    params[`fields[${i}]`] = name
  })

  const result = await airtablePaginatedGet(`/${input.baseId}/${input.tableId}`, token, params, {
    returnAll: false,
    limit,
  })

  return {
    records: result.records.map(mapRecord),
    truncated: result.truncated,
    baseId: input.baseId,
    tableId: input.tableId,
  }
}
