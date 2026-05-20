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
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getTwilioCallExecute,
  agent: { toolsetSlug: 'twilio.calls.read', idempotent: true },
})
