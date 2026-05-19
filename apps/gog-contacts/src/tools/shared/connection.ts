// src/tools/shared/connection.ts

/**
 * Resolve the bound Google Contacts connection for a tool call. Tools use
 * the unified `getConnection()` SDK helper — the platform bridge picks
 * the credId from `Agent.appAccounts['gog-contacts'].credId` (see
 * plans/kopilot/apps/agent-credentials.md §6.2). Gog-contacts is org-scope
 * (see plans/kopilot/apps/gog-contacts-overhaul.md §3 decision #1) so the
 * resolved credential is whichever connection the admin bound on the agent.
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/google-contacts/shared/google-contacts-api'

export function getContactsAccessToken(): string {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}
