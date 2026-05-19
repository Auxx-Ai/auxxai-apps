// src/blocks/supabase/shared/list-columns.server.ts

import { getOrganizationConnection, getOrganizationSetting } from '@auxx/sdk/server'
import { supabaseApi, throwConnectionNotFound, throwProjectUrlNotSet } from './supabase-api'
import { getSchemaHeaders } from './get-schema-headers'

/**
 * Fetch the columns for a table by reading its definition from PostgREST's
 * OpenAPI spec. The spec lives at `/rest/v1/` and `definitions[table]`
 * exposes the column shape.
 */
export default async function listColumns(
  table: string,
  schema: string = 'public'
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const projectUrl = await getOrganizationSetting<string>('projectUrl')
  if (!projectUrl) throwProjectUrlNotSet()

  const useCustomSchema = schema !== 'public'
  const headers = getSchemaHeaders('GET', useCustomSchema, schema)

  const spec = await supabaseApi('GET', '/', connection.value, projectUrl, { headers })
  const definition = (spec?.definitions ?? {})[table]
  if (!definition?.properties) return []

  return Object.entries(definition.properties as Record<string, any>)
    .map(([name, meta]) => {
      const type = meta?.type ?? meta?.format ?? 'unknown'
      return { label: `${name} (${type})`, value: name }
    })
    .sort((a, b) => a.value.localeCompare(b.value))
}
