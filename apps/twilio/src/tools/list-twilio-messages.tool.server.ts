// src/tools/list-twilio-messages.tool.server.ts

import { twilioApi } from '../blocks/twilio/shared/twilio-api'
import { getTwilioCreds } from './shared/connection'
import { type MappedMessage, mapMessage } from './shared/map-message'

interface ListTwilioMessagesInput {
  from?: string
  to?: string
  dateSentAfter?: string
  dateSentBefore?: string
  limit?: number
}

interface ListTwilioMessagesOutput {
  messages: MappedMessage[]
  hasMore: boolean
}

interface TwilioMessagesResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages?: any[]
  next_page_uri?: string | null
}

export default async function listTwilioMessages(
  input: ListTwilioMessagesInput
): Promise<ListTwilioMessagesOutput> {
  const { accountSid, authToken } = await getTwilioCreds()
  const limit = input.limit ?? 20

  const raw = await twilioApi<TwilioMessagesResponse>('/Messages.json', accountSid, authToken, {
    method: 'GET',
    query: {
      From: input.from,
      To: input.to,
      'DateSent>': input.dateSentAfter,
      'DateSent<': input.dateSentBefore,
      PageSize: String(limit),
    },
  })

  return {
    messages: (raw.messages ?? []).map(mapMessage),
    hasMore: Boolean(raw.next_page_uri),
  }
}
