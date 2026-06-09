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
  exampleOutput: {
    messages: [
      {
        sid: 'SM1a2b3c4d5e6f7890abcdef1234567890',
        status: 'delivered',
        direction: 'outbound-api',
        from: '+14155550132',
        to: '+14155550199',
        body: 'Your order has shipped and will arrive Friday.',
        numSegments: '1',
        numMedia: '0',
        price: '-0.0075',
        priceUnit: 'USD',
        errorCode: null,
        errorMessage: null,
        dateCreated: 'Mon, 01 Jun 2026 16:30:00 +0000',
        dateSent: 'Mon, 01 Jun 2026 16:30:02 +0000',
        dateUpdated: 'Mon, 01 Jun 2026 16:30:03 +0000',
      },
    ],
    hasMore: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: listTwilioMessagesExecute,
  agent: { toolsetSlug: 'twilio.messages.read', idempotent: true },
})
