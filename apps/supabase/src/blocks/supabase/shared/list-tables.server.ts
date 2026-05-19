// src/blocks/supabase/shared/list-tables.server.ts

import { getOrganizationConnection, getOrganizationSetting } from '@auxx/sdk/server'
import { supabaseApi, throwConnectionNotFound, throwProjectUrlNotSet } from './supabase-api'
import { getSchemaHeaders } from './get-schema-headers'

/**
 * Fetch the list of tables in a schema by reading PostgREST's OpenAPI
 * spec at `/rest/v1/`. The spec's `paths` keys are the table names.
 *
 * @param schema - Postgres schema name. Defaults to 'public'.
 */
export default async function listTables(
  schema: string = 'public'
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const projectUrl = await getOrganizationSetting<string>('projectUrl')
  if (!projectUrl) throwProjectUrlNotSet()

  const useCustomSchema = schema !== 'public'
  const headers = getSchemaHeaders('GET', useCustomSchema, schema)

  const spec = await supabaseApi('GET', '/', connection.value, projectUrl, { headers })

  const paths = (spec?.paths ?? {}) as Record<string, unknown>
  return Object.keys(paths)
    .filter((p) => p !== '/' && p.startsWith('/'))
    .map((p) => p.slice(1))
    .filter(Boolean)
    .sort()
    .map((name) => ({ label: name, value: name }))
}
