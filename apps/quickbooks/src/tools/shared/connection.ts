// src/tools/shared/connection.ts

/**
 * Resolve the bound QuickBooks connection + realmId + sandbox flag for a
 * tool call. Tools use the unified `getConnection()` SDK helper — the
 * platform bridge picks the credId from
 * `Agent.appAccounts['quickbooks'].credId`. Multi-realm orgs (one
 * connection per QB company) select which company an agent acts on via
 * the account picker; tools see one resolved connection.
 *
 * See plans/kopilot/apps/quickbooks-overhaul.md §3 decisions #1, #14, #15.
 */
import { getConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/quickbooks/shared/quickbooks-api'

export interface QuickBooksConnectionInfo {
  credential: string
  realmId: string
  sandbox: boolean
}

export async function getQuickbooksConnection(): Promise<QuickBooksConnectionInfo> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()

  const realmId = connection.metadata?.realmId
  if (!realmId) {
    const err = new Error(
      'QuickBooks connection is missing realmId. Reconnect under Settings → Apps → QuickBooks.'
    ) as Error & { code: string }
    err.code = 'CONNECTION_INVALID'
    throw err
  }

  const settings = await getOrganizationSettings()
  const sandbox = settings?.sandbox === true

  return { credential: connection.value, realmId, sandbox }
}

export function invalidInput(message: string): never {
  const err = new Error(message) as Error & { code: string }
  err.code = 'INVALID_INPUT'
  throw err
}
