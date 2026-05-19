// src/tools/shared/connection.ts

/**
 * Resolve the bound GitHub connection for a tool call. Tools use the unified
 * `getConnection()` SDK helper — the platform bridge picks the credId from
 * `Agent.appAccounts['github'].credId` (see plans/kopilot/apps/agent-credentials.md
 * §6.2). An org with multiple GitHub installations (personal + bot) selects
 * which one the agent acts on via the account picker — no tool-side scope
 * knowledge required.
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/github/shared/github-api'

export interface GithubConnectionInfo {
  token: string
}

export function getGithubConnection(): GithubConnectionInfo {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return { token: connection.value }
}
