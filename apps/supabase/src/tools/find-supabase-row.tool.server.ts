// src/tools/find-supabase-row.tool.server.ts

import { supabaseApi } from '../blocks/supabase/shared/supabase-api'
import { getSchemaHeaders } from '../blocks/supabase/shared/get-schema-headers'
import { getSupabaseAuth } from './shared/connection'
import { mapRow, type MappedSupabaseRow } from './shared/map-row'

interface FindSupabaseRowInput {
  table: string
  schema?: string
  column: string
  value: string
}

interface FindSupabaseRowOutput {
  row: MappedSupabaseRow | null
}

export default async function findSupabaseRow(
  input: FindSupabaseRowInput
): Promise<FindSupabaseRowOutput> {
  if (!input.table?.trim() || !input.column?.trim()) {
    const err = new Error('table and column are required.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }

  const { serviceRoleKey, projectUrl } = await getSupabaseAuth()
  const schema = (input.schema ?? 'public').trim() || 'public'
  const headers = getSchemaHeaders('GET', schema !== 'public', schema)

  const qs = {
    [input.column.trim()]: `eq.${input.value}`,
    limit: '2',
  }

  const rows = await supabaseApi(
    'GET',
    `/${encodeURIComponent(input.table.trim())}`,
    serviceRoleKey,
    projectUrl,
    { qs, headers }
  )

  const list = Array.isArray(rows) ? rows : []
  if (list.length === 0) return { row: null }
  if (list.length > 1) {
    const err = new Error(
      `Multiple rows matched ${input.column}=${input.value}. Use search_supabase_rows with tighter filters.`
    ) as Error & { code: string }
    err.code = 'MULTIPLE_MATCHES'
    throw err
  }
  return { row: mapRow(list[0]) }
}
