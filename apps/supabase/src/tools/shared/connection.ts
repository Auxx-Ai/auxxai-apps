// src/tools/shared/connection.ts

/**
 * Resolve the bound Supabase project + key for a tool call.
 *
 * Both halves are connection variables on one `secret` connect method: the
 * service_role key is only meaningful against the project it was issued for, so
 * pairing them anywhere else lets an org point one project's key at another's
 * host. Tools use the unified `getConnection()` SDK helper — the platform bridge
 * picks the credId from `Agent.appAccounts['supabase'].credId`.
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/supabase/shared/supabase-api'

export interface SupabaseAuth {
  serviceRoleKey: string
  projectUrl: string
}

export function getSupabaseAuth(): SupabaseAuth {
  const fields = getConnection()?.fields
  const serviceRoleKey = fields?.service_role_key?.trim()
  const projectUrl = fields?.project_url?.trim()
  if (!serviceRoleKey || !projectUrl) throwConnectionNotFound()
  return { serviceRoleKey, projectUrl }
}
