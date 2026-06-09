// src/tools/list-twilio-calls.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import twilioIcon from '../assets/icon.png'
import listTwilioCallsExecute from './list-twilio-calls.tool.server'

export const listTwilioCallsTool = defineTool({
  id: 'list_twilio_calls',
  name: 'List Twilio calls',
  description:
    'List recent voice calls on this Twilio account. Filter by sender, recipient, status, or start-date range.',
  icon: twilioIcon,
  inputs: z.object({
    from: z.string().optional().describe('Filter by caller E.164 number.'),
    to: z.string().optional().describe('Filter by called E.164 number.'),
    status: z
      .enum([
        'queued',
        'ringing',
        'in-progress',
        'completed',
        'busy',
        'failed',
        'no-answer',
        'canceled',
      ])
      .optional()
      .describe('Filter by call status.'),
    startedAfter: z.string().datetime().optional().describe('ISO 8601 lower bound on start time.'),
    startedBefore: z.string().datetime().optional().describe('ISO 8601 upper bound on start time.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Max calls to return (1-100, default 20).'),
  }),
  outputs: z.object({
    calls: z.array(
      z.object({
        sid: z.string(),
        status: z.string(),
        direction: z.string(),
        from: z.string(),
        to: z.string(),
        duration: z
          .string()
          .nullable()
          .describe('Call duration in seconds, null if not yet ended.'),
        price: z.string().nullable(),
        priceUnit: z.string().nullable(),
        startTime: z.string().nullable(),
        endTime: z.string().nullable(),
        dateCreated: z.string(),
        dateUpdated: z.string().nullable(),
        answeredBy: z
          .string()
          .nullable()
          .describe('"human" | "machine_start" | "machine_end_beep" | …'),
      })
    ),
    hasMore: z.boolean(),
  }),
  exampleOutput: {
    calls: [
      {
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
    ],
    hasMore: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: listTwilioCallsExecute,
  agent: { toolsetSlug: 'twilio.calls.read', idempotent: true },
})
