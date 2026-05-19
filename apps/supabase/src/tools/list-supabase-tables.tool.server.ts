// src/tools/list-supabase-tables.tool.server.ts

import { supabaseApi } from '../blocks/supabase/shared/supabase-api'
import { getSchemaHeaders } from '../blocks/supabase/shared/get-schema-headers'
import { getSupabaseAuth } from './shared/connection'

interface ListSupabaseTablesInput {
  schema?: string
}

interface ListSupabaseTablesOutput {
  schema: string
  tables: { name: string }[]
}

export default async function listSupabaseTables(
  input: ListSupabaseTablesInput
): Promise<ListSupabaseTablesOutput> {
  const { serviceRoleKey, projectUrl } = await getSupabaseAuth()
  const schema = (input.schema ?? 'public').trim() || 'public'

  const headers = getSchemaHeaders('GET', schema !== 'public', schema)
  const spec = await supabaseApi('GET', '/', serviceRoleKey, projectUrl, { headers })

  const paths = (spec?.paths ?? {}) as Record<string, unknown>
  const tables = Object.keys(paths)
    .filter((p) => p !== '/' && p.startsWith('/'))
    .map((p) => p.slice(1))
    .filter(Boolean)
    .sort()
    .map((name) => ({ name }))

  return { schema, tables }
}
