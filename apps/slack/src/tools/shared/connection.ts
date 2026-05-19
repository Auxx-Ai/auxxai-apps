// src/tools/shared/connection.ts

/**
 * Resolve the bound Slack connection for a tool call. Tools use the
 * unified `getConnection()` SDK helper — the platform bridge picks the
 * credId from `Agent.appAccounts['slack'].credId` (see
 * plans/kopilot/apps/agent-credentials.md §6.2).
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/slack/shared/slack-api'

export interface SlackConnectionInfo {
  token: string
}

export function getSlackConnection(): SlackConnectionInfo {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return { token: connection.value }
}
