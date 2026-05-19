// src/tools/get-twilio-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import getTwilioMessageExecute from './get-twilio-message.tool.server'

export const getTwilioMessageTool = defineTool({
  id: 'get_twilio_message',
  name: 'Get Twilio message',
  description:
    'Fetch a single Twilio message by SID — useful for chasing delivery status or failure details (errorCode + errorMessage).',
  icon: twilioIcon,
  inputs: z.object({
    sid: z.string().describe('Message SID (SMxxxxxxxx or MMxxxxxxxx for MMS).'),
  }),
  outputs: z.object({
    message: z.object({
      sid: z.string(),
      status: z.string(),
      direction: z.string(),
      from: z.string(),
      to: z.string(),
      body: z.string(),
      numSegments: z.string(),
      numMedia: z.string(),
      price: z.string().nullable(),
      priceUnit: z.string().nullable(),
      errorCode: z.string().nullable(),
      errorMessage: z.string().nullable(),
      dateCreated: z.string(),
      dateSent: z.string().nullable(),
      dateUpdated: z.string().nullable(),
    }),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getTwilioMessageExecute,
})
