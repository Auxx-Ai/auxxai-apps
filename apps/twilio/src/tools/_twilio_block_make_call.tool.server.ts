// src/tools/_twilio_block_make_call.tool.server.ts

import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { throwConnectionNotFound, twilioApi } from '../blocks/twilio/shared/twilio-api'

interface Input {
  from: string
  to: string
  message: string
  useTwiml?: boolean
  statusCallback?: string
}

interface Output {
  callSid: string
  status: string
  from: string
  to: string
  direction: string
  dateCreated: string
  price: string
  duration: string
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

export default async function twilioBlockMakeCall(input: Input): Promise<Output> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const authToken = connection.value

  const settings = await getOrganizationSettings<{ accountSid?: string }>()
  const accountSid = settings.accountSid as string | undefined
  if (!accountSid) {
    throw new Error('Twilio Account SID not configured. Go to Settings → Apps → Twilio.')
  }

  const twiml = input.useTwiml ? input.message : wrapInTwiml(input.message)

  const body: Record<string, string> = {
    From: input.from,
    To: input.to,
    Twiml: twiml,
  }
  if (input.statusCallback) body.StatusCallback = input.statusCallback

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
