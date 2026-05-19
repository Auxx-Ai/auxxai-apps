// src/tools/list-twilio-messages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import listTwilioMessagesExecute from './list-twilio-messages.tool.server'

export const listTwilioMessagesTool = defineTool({
  id: 'list_twilio_messages',
  name: 'List Twilio messages',
  description:
    'List recent SMS/MMS messages on this Twilio account. Filter by sender, recipient, or sent-date range. No cursor paging — tighten filters or extend the date window to see more.',
  icon: twilioIcon,
  inputs: z.object({
    from: z.string().optional().describe('Filter by sender E.164 number.'),
    to: z.string().optional().describe('Filter by recipient E.164 number.'),
    dateSentAfter: z
      .string()
      .datetime()
      .optional()
      .describe('ISO 8601 lower bound on date sent (inclusive).'),
    dateSentBefore: z
      .string()
      .datetime()
      .optional()
      .describe('ISO 8601 upper bound on date sent (inclusive).'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Max messages to return (1-100, default 20).'),
  }),
  outputs: z.object({
    messages: z.array(
      z.object({
        sid: z.string(),
        status: z.string().describe('queued | sending | sent | delivered | failed | …'),
        direction: z.string().describe('inbound | outbound-api | outbound-call | outbound-reply'),
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
      })
    ),
    hasMore: z.boolean().describe('True if Twilio reports another page of results beyond limit.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: listTwilioMessagesExecute,
})
