// src/blocks/twilio/resources/call/call-execute.server.ts

import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { twilioApi, throwConnectionNotFound } from '../../shared/twilio-api'

export async function executeCall(
  operation: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const authToken = connection.value

  const settings = await getOrganizationSettings()
  const accountSid = settings.accountSid as string | undefined
  if (!accountSid) {
    throw new Error('Twilio Account SID not configured. Go to Settings → Apps → Twilio.')
  }

  switch (operation) {
    case 'make':
      return makeCall(accountSid, authToken, input)
    default:
      throw new Error(`Unknown call operation: ${operation}`)
  }
}

function wrapInTwiml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
  return `<Response><Say>${escaped}</Say></Response>`
}

async function makeCall(
  accountSid: string,
  authToken: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const twiml = input.makeUseTwiml ? input.makeMessage : wrapInTwiml(input.makeMessage)

  const body: Record<string, string> = {
    From: input.makeFrom,
    To: input.makeTo,
    Twiml: twiml,
  }
  if (input.makeStatusCallback) body.StatusCallback = input.makeStatusCallback

  const result: any = await twilioApi('/Calls.json', accountSid, authToken, { body })

  return {
    callSid: result.sid ?? '',
    status: result.status ?? '',
    from: result.from ?? '',
    to: result.to ?? '',
    direction: result.direction ?? '',
    dateCreated: result.date_created ?? '',
    price: result.price ?? '',
    duration: result.duration ?? '',
  }
}
