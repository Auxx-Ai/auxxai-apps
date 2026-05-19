// src/tools/insert-supabase-row.tool.server.ts

import { supabaseApi } from '../blocks/supabase/shared/supabase-api'
import { getSchemaHeaders } from '../blocks/supabase/shared/get-schema-headers'
import { getSupabaseAuth } from './shared/connection'
import { mapRow, type MappedSupabaseRow } from './shared/map-row'

interface InsertSupabaseRowInput {
  table: string
  schema?: string
  values: Record<string, unknown>
}

interface InsertSupabaseRowOutput {
  row: MappedSupabaseRow
}

export default async function insertSupabaseRow(
  input: InsertSupabaseRowInput
): Promise<InsertSupabaseRowOutput> {
  if (!input.table?.trim()) {
    const err = new Error('table is required.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }
  if (!input.values || typeof input.values !== 'object' || Array.isArray(input.values)) {
    const err = new Error('values must be a column → value object.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }
  if (Object.keys(input.values).length === 0) {
    const err = new Error('values must contain at least one column.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }

  const { serviceRoleKey, projectUrl } = await getSupabaseAuth()
  const schema = (input.schema ?? 'public').trim() || 'public'
  const headers = getSchemaHeaders('POST', schema !== 'public', schema)

  const result = await supabaseApi(
    'POST',
    `/${encodeURIComponent(input.table.trim())}`,
    serviceRoleKey,
    projectUrl,
    {
      body: input.values,
      headers,
    }
  )

  const row = Array.isArray(result) ? result[0] : result
  return { row: mapRow(row) }
}
