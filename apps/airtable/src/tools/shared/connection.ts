// src/tools/shared/connection.ts

/**
 * Resolve the bound Airtable connection for a tool call. Tools use the
 * unified `getConnection()` SDK helper — the platform bridge picks the
 * credId from `Agent.appAccounts['airtable'].credId`.
 *
 * Airtable uses OAuth2; `connection.value` is the access token consumed
 * directly by `airtableApi`. See plans/kopilot/apps/airtable-overhaul.md §7.
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/airtable/shared/airtable-api'

export function getAirtableToken(): string {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}
