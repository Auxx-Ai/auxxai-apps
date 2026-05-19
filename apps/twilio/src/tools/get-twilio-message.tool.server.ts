// src/tools/get-twilio-message.tool.server.ts

import { twilioApi } from '../blocks/twilio/shared/twilio-api'
import { getTwilioCreds } from './shared/connection'
import { type MappedMessage, mapMessage } from './shared/map-message'

interface GetTwilioMessageInput {
  sid: string
}

interface GetTwilioMessageOutput {
  message: MappedMessage
}

export default async function getTwilioMessage(
  input: GetTwilioMessageInput
): Promise<GetTwilioMessageOutput> {
  const { accountSid, authToken } = await getTwilioCreds()

  const raw = await twilioApi<unknown>(
    `/Messages/${encodeURIComponent(input.sid)}.json`,
    accountSid,
    authToken,
    { method: 'GET' }
  )

  return { message: mapMessage(raw) }
}
