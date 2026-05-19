// src/tools/list-twilio-phone-numbers.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import listTwilioPhoneNumbersExecute from './list-twilio-phone-numbers.tool.server'

export const listTwilioPhoneNumbersTool = defineTool({
  id: 'list_twilio_phone_numbers',
  name: 'List Twilio phone numbers',
  description:
    "List the phone numbers owned by this Twilio account. Call before send_twilio_sms or make_twilio_call when the user hasn't named a sender — Twilio writes require a verified Twilio-owned `From`.",
  icon: twilioIcon,
  inputs: z.object({}),
  outputs: z.object({
    phoneNumbers: z
      .array(
        z.object({
          sid: z.string().describe('IncomingPhoneNumber SID (PNxxxxxxxx).'),
          phoneNumber: z.string().describe('E.164 number, e.g. +14155238886.'),
          friendlyName: z.string(),
          capabilities: z.object({
            sms: z.boolean(),
            mms: z.boolean(),
            voice: z.boolean(),
            fax: z.boolean(),
          }),
        })
      )
      .describe('All Twilio numbers on the connected account.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listTwilioPhoneNumbersExecute,
})
