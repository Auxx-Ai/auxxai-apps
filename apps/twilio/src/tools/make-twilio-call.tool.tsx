// src/tools/make-twilio-call.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import makeTwilioCallExecute from './make-twilio-call.tool.server'

const E164 = /^\+[1-9]\d{1,14}$/

export const makeTwilioCallTool = defineTool({
  id: 'make_twilio_call',
  name: 'Make Twilio call',
  description:
    'Place an outbound voice call via Twilio. The recipient hears the spokenMessage when they answer. Server wraps text as TwiML — no raw TwiML accepted. `from` must be a Twilio-owned voice-capable number. Enabling this toolset is the authorization to call.',
  icon: twilioIcon,
  inputs: z
    .object({
      from: z.string().describe('Twilio-owned E.164 number to call from.'),
      to: z.string().describe('Destination E.164 number.'),
      spokenMessage: z
        .string()
        .min(1)
        .max(4000)
        .describe(
          'Text the recipient will hear when they pick up. XML-escaped and wrapped in <Response><Say>…</Say></Response>.'
        ),
    })
    .refine((v) => E164.test(v.from), { message: 'from must be E.164', path: ['from'] })
    .refine((v) => E164.test(v.to), { message: 'to must be E.164', path: ['to'] }),
  outputs: z.object({
    callSid: z.string(),
    status: z.string(),
    from: z.string(),
    to: z.string(),
    direction: z.string().describe('"outbound-api" for tool-driven calls.'),
    dateCreated: z.string(),
  }),
  exampleOutput: {
    callSid: 'CA1a2b3c4d5e6f7890abcdef1234567890',
    status: 'queued',
    from: '+14155550132',
    to: '+14155550199',
    direction: 'outbound-api',
    dateCreated: 'Mon, 01 Jun 2026 16:29:58 +0000',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: makeTwilioCallExecute,
  agent: { toolsetSlug: 'twilio.calls.write' },
})
