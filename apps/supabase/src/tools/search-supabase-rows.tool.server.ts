// src/tools/search-supabase-rows.tool.server.ts

import { supabaseApi } from '../blocks/supabase/shared/supabase-api'
import { buildFilterQuery, type Filter } from '../blocks/supabase/shared/build-filter-query'
import { getSchemaHeaders } from '../blocks/supabase/shared/get-schema-headers'
import { getSupabaseAuth } from './shared/connection'
import { mapRow, type MappedSupabaseRow } from './shared/map-row'

type ToolOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is'
type ToolMatch = 'and' | 'or'

interface SearchSupabaseRowsInput {
  table: string
  schema?: string
  filters?: { column: string; op: ToolOp; value: string }[]
  matchType?: ToolMatch
  rawFilter?: string
  limit?: number
  orderBy?: string
}

interface SearchSupabaseRowsOutput {
  rows: MappedSupabaseRow[]
  totalCount: number
  truncated: boolean
}

export default async function searchSupabaseRows(
  input: SearchSupabaseRowsInput
): Promise<SearchSupabaseRowsOutput> {
  if (!input.table?.trim()) {
    const err = new Error('table is required.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }

  const filters = input.filters ?? []
  for (const f of filters) {
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
  const headers = getSchemaHeaders('GET', schema !== 'public', schema)
  const limit = Math.min(input.limit ?? 50, 200)

  const structuredFilters: Filter[] = filters.map((f) => ({
    column: f.column,
    condition: f.op,
    value: f.value ?? '',
  }))
  const matchType = input.matchType === 'or' ? 'anyFilter' : 'allFilters'
  const qs: Record<string, string> = {
    ...buildFilterQuery(structuredFilters, matchType),
    limit: String(limit + 1), // +1 sentinel to detect truncation
  }

  if (input.orderBy?.trim()) {
    const raw = input.orderBy.trim()
    const desc = raw.startsWith('-')
    const col = desc ? raw.slice(1) : raw
    qs.order = `${col}.${desc ? 'desc' : 'asc'}`
  }

  let endpoint = `/${encodeURIComponent(input.table.trim())}`
  if (input.rawFilter?.trim()) {
    const raw = input.rawFilter.trim().replace(/^[?&]/, '')
    endpoint += endpoint.includes('?') ? `&${raw}` : `?${raw}`
  }

  const result = await supabaseApi('GET', endpoint, serviceRoleKey, projectUrl, { qs, headers })
  const list = Array.isArray(result) ? result : []
  const truncated = list.length > limit
  const rows = (truncated ? list.slice(0, limit) : list).map(mapRow)

  return { rows, totalCount: rows.length, truncated }
}
