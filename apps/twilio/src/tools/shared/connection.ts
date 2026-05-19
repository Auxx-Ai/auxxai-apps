// src/tools/shared/connection.ts

/**
 * Resolve the bound Twilio credentials for a tool call. Twilio is the first
 * tool surface where `getConnection()` alone is not sufficient: the REST API
 * uses HTTP Basic with Account SID (org setting) as username and Auth Token
 * (`secret` cred) as password. See plans/kopilot/apps/twilio-overhaul.md §7.
 */
import { getConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { BlockRuntimeError } from '@auxx/sdk/shared'

export interface TwilioCreds {
  accountSid: string
  authToken: string
}

export async function getTwilioCreds(): Promise<TwilioCreds> {
  const connection = getConnection()
  if (!connection?.value) {
    throw new BlockRuntimeError(
      'Twilio Auth Token not connected. Connect Twilio in Apps → Twilio.',
      'CONNECTION_REQUIRED'
    )
  }

  const settings = await getOrganizationSettings<{ accountSid?: string }>()
  const accountSid = settings.accountSid?.trim()
  if (!accountSid) {
    throw new BlockRuntimeError(
      'Twilio Account SID not configured. Go to Settings → Apps → Twilio.',
      'INVALID_CONFIG'
    )
  }

  return { accountSid, authToken: connection.value }
}
