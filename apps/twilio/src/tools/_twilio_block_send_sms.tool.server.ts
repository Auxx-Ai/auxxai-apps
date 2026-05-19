// src/tools/_twilio_block_send_sms.tool.server.ts

import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { throwConnectionNotFound, twilioApi } from '../blocks/twilio/shared/twilio-api'

interface Input {
  from: string
  to: string
  body: string
  asWhatsApp?: boolean
  statusCallback?: string
}

interface Output {
  messageSid: string
  status: string
  from: string
  to: string
  body: string
  dateCreated: string
  price: string
  errorCode: string
  errorMessage: string
}

export default async function twilioBlockSendSms(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const authToken = connection.value

  const settings = await getOrganizationSettings<{ accountSid?: string }>()
  const accountSid = settings.accountSid as string | undefined
  if (!accountSid) {
    throw new Error('Twilio Account SID not configured. Go to Settings → Apps → Twilio.')
  }

  const from = input.asWhatsApp ? `whatsapp:${input.from}` : input.from
  const to = input.asWhatsApp ? `whatsapp:${input.to}` : input.to

  const body: Record<string, string> = {
    From: from,
    To: to,
    Body: input.body,
  }
  if (input.statusCallback) body.StatusCallback = input.statusCallback

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
