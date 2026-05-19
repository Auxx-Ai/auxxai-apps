// src/tools/list-twilio-phone-numbers.tool.server.ts

import { twilioApi } from '../blocks/twilio/shared/twilio-api'
import { getTwilioCreds } from './shared/connection'
import { type MappedPhoneNumber, mapPhoneNumber } from './shared/map-phone-number'

interface ListTwilioPhoneNumbersOutput {
  phoneNumbers: MappedPhoneNumber[]
}

interface TwilioListResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incoming_phone_numbers?: any[]
}

export default async function listTwilioPhoneNumbers(): Promise<ListTwilioPhoneNumbersOutput> {
  const { accountSid, authToken } = await getTwilioCreds()

  const raw = await twilioApi<TwilioListResponse>(
    '/IncomingPhoneNumbers.json',
    accountSid,
    authToken,
    { method: 'GET' }
  )

  return {
    phoneNumbers: (raw.incoming_phone_numbers ?? []).map(mapPhoneNumber),
  }
}
