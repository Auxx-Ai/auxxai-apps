// src/tools/get-twilio-call.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import getTwilioCallExecute from './get-twilio-call.tool.server'

export const getTwilioCallTool = defineTool({
  id: 'get_twilio_call',
  name: 'Get Twilio call',
  description:
    'Fetch a single Twilio call by SID — useful for retrieving final duration, price, and answeredBy after a call ends.',
  icon: twilioIcon,
  inputs: z.object({
    sid: z.string().describe('Call SID (CAxxxxxxxx).'),
  }),
  outputs: z.object({
    call: z.object({
      sid: z.string(),
      status: z.string(),
      direction: z.string(),
      from: z.string(),
      to: z.string(),
      duration: z.string().nullable(),
      price: z.string().nullable(),
      priceUnit: z.string().nullable(),
      startTime: z.string().nullable(),
      endTime: z.string().nullable(),
      dateCreated: z.string(),
      dateUpdated: z.string().nullable(),
      answeredBy: z.string().nullable(),
    }),
  }),
  exampleOutput: {
    call: {
      sid: 'CA1a2b3c4d5e6f7890abcdef1234567890',
      status: 'completed',
      direction: 'outbound-api',
      from: '+14155550132',
      to: '+14155550199',
      duration: '42',
      price: '-0.0085',
      priceUnit: 'USD',
      startTime: 'Mon, 01 Jun 2026 16:30:00 +0000',
      endTime: 'Mon, 01 Jun 2026 16:30:42 +0000',
      dateCreated: 'Mon, 01 Jun 2026 16:29:58 +0000',
      dateUpdated: 'Mon, 01 Jun 2026 16:30:42 +0000',
      answeredBy: 'human',
    },
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getTwilioCallExecute,
  agent: { toolsetSlug: 'twilio.calls.read', idempotent: true },
})
