// src/tools/update-supabase-rows.tool.server.ts

import { supabaseApi } from '../blocks/supabase/shared/supabase-api'
import { buildFilterQuery, type Filter } from '../blocks/supabase/shared/build-filter-query'
import { getSchemaHeaders } from '../blocks/supabase/shared/get-schema-headers'
import { getSupabaseAuth } from './shared/connection'
import { mapRow, type MappedSupabaseRow } from './shared/map-row'

type ToolOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is'

interface UpdateSupabaseRowsInput {
  table: string
  schema?: string
  filters: { column: string; op: ToolOp; value: string }[]
  matchType?: 'and' | 'or'
  values: Record<string, unknown>
  dryRun?: boolean
}

interface UpdateSupabaseRowsOutput {
  affectedCount: number
  rows: MappedSupabaseRow[]
  dryRun: boolean
}

export default async function updateSupabaseRows(
  input: UpdateSupabaseRowsInput
): Promise<UpdateSupabaseRowsOutput> {
  if (!input.table?.trim()) {
    const err = new Error('table is required.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }
  if (!input.filters || input.filters.length === 0) {
    const err = new Error(
      'At least one filter is required to avoid updating every row in the table.'
    ) as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }
  if (
    !input.values ||
    typeof input.values !== 'object' ||
    Array.isArray(input.values) ||
    Object.keys(input.values).length === 0
  ) {
    const err = new Error(
      'values must be a column → value object with at least one column.'
    ) as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }
  for (const f of input.filters) {
    if (!f.column || !f.op) {
      const err = new Error('Each filter requires a column and op.') as Error & { code: string }
      err.code = 'INVALID_INPUT'
      throw err
    }
    if (f.op !== 'is' && (f.value === undefined || f.value === '')) {
      const err = new Error(`Filter op "${f.op}" requires a value.`) as Error & { code: string }
      err.code = 'INVALID_INPUT'
      throw err
    }
  }

  const { serviceRoleKey, projectUrl } = await getSupabaseAuth()
  const schema = (input.schema ?? 'public').trim() || 'public'
  const dryRun = input.dryRun === true

  const structuredFilters: Filter[] = input.filters.map((f) => ({
    column: f.column,
    condition: f.op,
    value: f.value ?? '',
  }))
  const matchType = input.matchType === 'or' ? 'anyFilter' : 'allFilters'
  const qs = buildFilterQuery(structuredFilters, matchType)
  const endpoint = `/${encodeURIComponent(input.table.trim())}`

  if (dryRun) {
    const headers = getSchemaHeaders('GET', schema !== 'public', schema)
    const previewQs = { ...qs, limit: '100' }
    const result = await supabaseApi('GET', endpoint, serviceRoleKey, projectUrl, {
      qs: previewQs,
      headers,
    })
    const rows = (Array.isArray(result) ? result : []).map(mapRow)
    return { affectedCount: rows.length, rows, dryRun: true }
  }

  const headers = getSchemaHeaders('PATCH', schema !== 'public', schema)
  const result = await supabaseApi('PATCH', endpoint, serviceRoleKey, projectUrl, {
    body: input.values,
    qs,
    headers,
  })
  const rows = (Array.isArray(result) ? result : []).map(mapRow)
  return { affectedCount: rows.length, rows, dryRun: false }
}
