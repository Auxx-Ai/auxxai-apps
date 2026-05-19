// src/tools/shared/connection.ts

/**
 * Resolve the bound Microsoft Teams connection for a tool call. Tools
 * use the unified `getConnection()` SDK helper — the platform bridge
 * picks the credId from `Agent.appAccounts['ms-teams'].credId`
 * (see plans/kopilot/apps/agent-credentials.md §6.2).
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/ms-teams/shared/ms-teams-api'

export interface MsTeamsConnectionInfo {
  token: string
}

export function getMsTeamsConnection(): MsTeamsConnectionInfo {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return { token: connection.value }
}
