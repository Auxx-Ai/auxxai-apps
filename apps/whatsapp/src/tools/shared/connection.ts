// src/tools/shared/connection.ts

/**
 * Resolve the bound WhatsApp connection for a tool call. Tools use the unified
 * `getConnection()` SDK helper — the platform bridge picks the credId from
 * `Agent.appAccounts['whatsapp'].credId` (see
 * plans/kopilot/apps/agent-credentials.md §6.2).
 *
 * All four values are connection variables on one connect method. The access token
 * is minted for one Meta app against one business account, so the app id, the app
 * secret that signs its webhooks and the WABA it reads all belong to the same
 * connection — held apart they can name different Meta apps with nothing noticing.
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/whatsapp/shared/whatsapp-api'

export interface WhatsappConnectionInfo {
  token: string
  businessAccountId: string
  appId: string
  appSecret: string
}

export function getWhatsappConnection(): WhatsappConnectionInfo {
  const connection = getConnection()
  const fields = connection?.fields
  const token = fields?.access_token?.trim()
  if (!token) throwConnectionNotFound()
  return {
    token,
    businessAccountId: fields?.business_account_id?.trim() ?? '',
    appId: fields?.app_id?.trim() ?? '',
    appSecret: fields?.app_secret?.trim() ?? '',
  }
}
