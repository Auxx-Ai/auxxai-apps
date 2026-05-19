// src/tools/make-twilio-call.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { twilioApi } from '../blocks/twilio/shared/twilio-api'
import { getTwilioCreds } from './shared/connection'
import { wrapTwiml } from './shared/wrap-twiml'

const E164 = /^\+[1-9]\d{1,14}$/

interface MakeTwilioCallInput {
  from: string
  to: string
  spokenMessage: string
}

interface MakeTwilioCallOutput {
  callSid: string
  status: string
  from: string
  to: string
  direction: string
  dateCreated: string
}

export default async function makeTwilioCall(
  input: MakeTwilioCallInput
): Promise<MakeTwilioCallOutput> {
  if (!E164.test(input.from)) {
    throw new BlockRuntimeError('from must be E.164 (e.g. +14155238886).', 'INVALID_INPUT')
  }
  if (!E164.test(input.to)) {
    throw new BlockRuntimeError('to must be E.164 (e.g. +14155238886).', 'INVALID_INPUT')
  }
  const spoken = input.spokenMessage?.trim() ?? ''
  if (spoken.length < 1 || spoken.length > 4000) {
    throw new BlockRuntimeError(
      'spokenMessage must be 1-4000 characters after trimming.',
      'INVALID_INPUT'
    )
  }

  const { accountSid, authToken } = await getTwilioCreds()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await twilioApi<any>('/Calls.json', accountSid, authToken, {
    body: { From: input.from, To: input.to, Twiml: wrapTwiml(spoken) },
  })

  return {
    callSid: result.sid ?? '',
    status: result.status ?? '',
    from: result.from ?? '',
    to: result.to ?? '',
    direction: result.direction ?? '',
    dateCreated: result.date_created ?? '',
  }
}
