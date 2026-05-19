// src/tools/get-supabase-table-schema.tool.server.ts

import { supabaseApi } from '../blocks/supabase/shared/supabase-api'
import { getSchemaHeaders } from '../blocks/supabase/shared/get-schema-headers'
import { getSupabaseAuth } from './shared/connection'
import { mapTableSchema, type MappedTableSchema } from './shared/map-table-schema'

interface GetSupabaseTableSchemaInput {
  table: string
  schema?: string
}

export default async function getSupabaseTableSchema(
  input: GetSupabaseTableSchemaInput
): Promise<MappedTableSchema> {
  const { serviceRoleKey, projectUrl } = await getSupabaseAuth()
  const schema = (input.schema ?? 'public').trim() || 'public'

  if (!input.table?.trim()) {
    const err = new Error('table is required.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }
  const table = input.table.trim()

  const headers = getSchemaHeaders('GET', schema !== 'public', schema)
  const spec = await supabaseApi('GET', '/', serviceRoleKey, projectUrl, { headers })
  const definition = (spec?.definitions ?? {})[table]

  if (!definition) {
    const err = new Error(
      `Table "${table}" not found in schema "${schema}". Use list_supabase_tables to discover available tables.`
    ) as Error & { code: string }
    err.code = 'NOT_FOUND'
    throw err
  }

  return mapTableSchema(schema, table, definition)
}
