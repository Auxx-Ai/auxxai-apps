// src/tools/list-twilio-calls.tool.server.ts

import { twilioApi } from '../blocks/twilio/shared/twilio-api'
import { getTwilioCreds } from './shared/connection'
import { type MappedCall, mapCall } from './shared/map-call'

interface ListTwilioCallsInput {
  from?: string
  to?: string
  status?: string
  startedAfter?: string
  startedBefore?: string
  limit?: number
}

interface ListTwilioCallsOutput {
  calls: MappedCall[]
  hasMore: boolean
}

interface TwilioCallsResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calls?: any[]
  next_page_uri?: string | null
}

export default async function listTwilioCalls(
  input: ListTwilioCallsInput
): Promise<ListTwilioCallsOutput> {
  const { accountSid, authToken } = await getTwilioCreds()
  const limit = input.limit ?? 20

  const raw = await twilioApi<TwilioCallsResponse>('/Calls.json', accountSid, authToken, {
    method: 'GET',
    query: {
      From: input.from,
      To: input.to,
      Status: input.status,
      'StartTime>': input.startedAfter,
      'StartTime<': input.startedBefore,
      PageSize: String(limit),
    },
  })

  return {
    calls: (raw.calls ?? []).map(mapCall),
    hasMore: Boolean(raw.next_page_uri),
  }
}
