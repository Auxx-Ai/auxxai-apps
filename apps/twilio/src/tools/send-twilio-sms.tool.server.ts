// src/tools/send-twilio-sms.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { twilioApi } from '../blocks/twilio/shared/twilio-api'
import { getTwilioCreds } from './shared/connection'

const E164 = /^\+[1-9]\d{1,14}$/

interface SendTwilioSmsInput {
  from: string
  to: string
  body: string
}

interface SendTwilioSmsOutput {
  messageSid: string
  status: string
  from: string
  to: string
  body: string
  dateCreated: string
  price: string | null
  errorCode: string | null
  errorMessage: string | null
}

export default async function sendTwilioSms(
  input: SendTwilioSmsInput
): Promise<SendTwilioSmsOutput> {
  // Server-side .refine() re-check — the JSON Schema converter strips refines.
  if (!E164.test(input.from)) {
    throw new BlockRuntimeError('from must be E.164 (e.g. +14155238886).', 'INVALID_INPUT')
  }
  if (!E164.test(input.to)) {
    throw new BlockRuntimeError('to must be E.164 (e.g. +14155238886).', 'INVALID_INPUT')
  }
  const body = input.body?.trim() ?? ''
  if (body.length < 1 || body.length > 1600) {
    throw new BlockRuntimeError('body must be 1-1600 characters after trimming.', 'INVALID_INPUT')
  }

  const { accountSid, authToken } = await getTwilioCreds()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await twilioApi<any>('/Messages.json', accountSid, authToken, {
    body: { From: input.from, To: input.to, Body: body },
  })

  return {
    messageSid: result.sid ?? '',
    status: result.status ?? '',
    from: result.from ?? '',
    to: result.to ?? '',
    body: result.body ?? '',
    dateCreated: result.date_created ?? '',
    price: result.price ?? null,
    errorCode: result.error_code != null ? String(result.error_code) : null,
    errorMessage: result.error_message ?? null,
  }
}
