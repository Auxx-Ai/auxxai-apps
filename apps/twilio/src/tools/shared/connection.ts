// src/tools/shared/connection.ts

/**
 * Resolve the bound Twilio credentials for a tool call. The Twilio REST API uses
 * HTTP Basic with the Account SID as username and the Auth Token as password, so
 * both are connection variables on one `secret` connect method: the SID identifies
 * the account the token is valid for, and pairing them anywhere else lets one
 * change without the other. See plans/kopilot/apps/twilio-overhaul.md §7.
 */
import { getConnection } from '@auxx/sdk/server'
import { BlockRuntimeError } from '@auxx/sdk/shared'

export interface TwilioCreds {
  accountSid: string
  authToken: string
}

export function getTwilioCreds(): TwilioCreds {
  const fields = getConnection()?.fields
  const accountSid = fields?.account_sid?.trim()
  const authToken = fields?.auth_token?.trim()

  if (!accountSid || !authToken) {
    throw new BlockRuntimeError(
      'Twilio not connected. Connect Twilio in Apps → Twilio.',
      'CONNECTION_REQUIRED'
    )
  }

  return { accountSid, authToken }
}
