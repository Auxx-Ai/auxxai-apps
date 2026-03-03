// src/blocks/twilio/resources/sms/sms-execute.server.ts

import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { twilioApi, throwConnectionNotFound } from '../../shared/twilio-api'

export async function executeSms(
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
    case 'send':
      return sendSms(accountSid, authToken, input)
    default:
      throw new Error(`Unknown SMS operation: ${operation}`)
  }
}

async function sendSms(
  accountSid: string,
  authToken: string,
  input: Record<string, any>,
): Promise<Record<string, string>> {
  const from = input.sendToWhatsApp ? `whatsapp:${input.sendFrom}` : input.sendFrom
  const to = input.sendToWhatsApp ? `whatsapp:${input.sendTo}` : input.sendTo

  const body: Record<string, string> = {
    From: from,
    To: to,
    Body: input.sendMessage,
  }
  if (input.sendStatusCallback) body.StatusCallback = input.sendStatusCallback

  const result: any = await twilioApi('/Messages.json', accountSid, authToken, { body })

  return {
    messageSid: result.sid ?? '',
    status: result.status ?? '',
    from: result.from ?? '',
    to: result.to ?? '',
    body: result.body ?? '',
    dateCreated: result.date_created ?? '',
    price: result.price ?? '',
    errorCode: result.error_code?.toString() ?? '',
    errorMessage: result.error_message ?? '',
  }
}
