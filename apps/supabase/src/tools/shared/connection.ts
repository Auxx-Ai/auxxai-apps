// src/tools/shared/connection.ts

/**
 * Resolve the bound Supabase connection + projectUrl for a tool call.
 *
 * Tools use the unified `getConnection()` SDK helper — the platform bridge
 * picks the credId from `Agent.appAccounts['supabase'].credId`.
 *
 * The projectUrl lives in org settings (per the overhaul plan §8 Q1).
 */
import { getConnection, getOrganizationSetting } from '@auxx/sdk/server'
import { throwConnectionNotFound, throwProjectUrlNotSet } from '../../blocks/supabase/shared/supabase-api'

export interface SupabaseAuth {
  serviceRoleKey: string
  projectUrl: string
}

export async function getSupabaseAuth(): Promise<SupabaseAuth> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()

  const projectUrl = await getOrganizationSetting<string>('projectUrl')
  if (!projectUrl) throwProjectUrlNotSet()

  return { serviceRoleKey: connection.value, projectUrl }
}
