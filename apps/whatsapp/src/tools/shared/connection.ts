// src/tools/shared/connection.ts

/**
 * Resolve the bound WhatsApp connection for a tool call. Tools use the
 * unified `getConnection()` SDK helper — the platform bridge picks the
 * credId from `Agent.appAccounts['whatsapp'].credId` (see
 * plans/kopilot/apps/agent-credentials.md §6.2).
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/whatsapp/shared/whatsapp-api'

export interface WhatsappConnectionInfo {
  token: string
}

export function getWhatsappConnection(): WhatsappConnectionInfo {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return { token: connection.value }
}
