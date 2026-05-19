// src/tools/get-twilio-call.tool.server.ts

import { twilioApi } from '../blocks/twilio/shared/twilio-api'
import { getTwilioCreds } from './shared/connection'
import { type MappedCall, mapCall } from './shared/map-call'

interface GetTwilioCallInput {
  sid: string
}

interface GetTwilioCallOutput {
  call: MappedCall
}

export default async function getTwilioCall(
  input: GetTwilioCallInput
): Promise<GetTwilioCallOutput> {
  const { accountSid, authToken } = await getTwilioCreds()

  const raw = await twilioApi<unknown>(
    `/Calls/${encodeURIComponent(input.sid)}.json`,
    accountSid,
    authToken,
    { method: 'GET' }
  )

  return { call: mapCall(raw) }
}
