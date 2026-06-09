// src/tools/send-twilio-sms.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import sendTwilioSmsExecute from './send-twilio-sms.tool.server'

const E164 = /^\+[1-9]\d{1,14}$/

export const sendTwilioSmsTool = defineTool({
  id: 'send_twilio_sms',
  name: 'Send Twilio SMS',
  description:
    'Send an SMS message via Twilio. Both `from` and `to` must be E.164 (+ country code + digits). `from` must be a Twilio-owned number — call list_twilio_phone_numbers first if unsure. Enabling this toolset on an agent is the authorization to send.',
  icon: twilioIcon,
  inputs: z
    .object({
      from: z
        .string()
        .describe('Twilio-owned E.164 number to send from (see list_twilio_phone_numbers).'),
      to: z.string().describe('Recipient E.164 number (e.g. +14155238886).'),
      body: z
        .string()
        .min(1)
        .max(1600)
        .describe(
          'Message body. Twilio splits >160 chars into segments; cap at 1600 to keep cost predictable.'
        ),
    })
    .refine((v) => E164.test(v.from), { message: 'from must be E.164', path: ['from'] })
    .refine((v) => E164.test(v.to), { message: 'to must be E.164', path: ['to'] }),
  outputs: z.object({
    messageSid: z.string(),
    status: z.string().describe('queued | sending | sent | failed | …'),
    from: z.string(),
    to: z.string(),
    body: z.string(),
    dateCreated: z.string(),
    price: z.string().nullable(),
    errorCode: z.string().nullable(),
    errorMessage: z.string().nullable(),
  }),
  exampleOutput: {
    messageSid: 'SM1a2b3c4d5e6f7890abcdef1234567890',
    status: 'queued',
    from: '+14155550132',
    to: '+14155550199',
    body: 'Your order has shipped and will arrive Friday.',
    dateCreated: 'Mon, 01 Jun 2026 16:30:00 +0000',
    price: null,
    errorCode: null,
    errorMessage: null,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: sendTwilioSmsExecute,
  agent: { toolsetSlug: 'twilio.messages.write' },
})
