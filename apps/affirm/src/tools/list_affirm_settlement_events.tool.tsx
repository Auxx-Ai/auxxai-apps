// src/tools/list_affirm_settlement_events.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import affirmIcon from '../assets/affirm.png'
import listAffirmSettlementEventsExecute from './list_affirm_settlement_events.tool.server'
import { exampleSettlementEvent, settlementEventSchema } from './shared/schemas'

export const listAffirmSettlementEventsTool = defineTool({
  id: 'list_affirm_settlement_events',
  name: 'List Affirm settlement events',
  description:
    'List the individual settlement events behind Affirm deposits: what was captured, refunded ' +
    'or charged as a fee, with the order it belongs to. IMPORTANT: Affirm provides NO deposit ' +
    'filter on this feed — passing depositId reads the DATE WINDOW and filters locally, so a ' +
    "result is only the complete membership of that deposit when 'complete' is true. If " +
    "'hasMore' is true, say the list is partial rather than implying it is everything. Events " +
    'with no deposit are normal. READ-ONLY.',
  icon: affirmIcon,
  inputs: z.object({
    after: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe(
        'Earliest event date, YYYY-MM-DD. With depositId and no "before", this is taken as the ' +
          'settlement date and widened by a day either side.'
      ),
    before: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe('Latest event date, YYYY-MM-DD.'),
    depositId: z
      .string()
      .optional()
      .describe('Keep only events for this deposit_id. Filtered locally, not by Affirm.'),
    limit: z.number().int().min(1).max(250).optional().describe('Rows per page. Defaults to 250.'),
    cursor: z.string().optional().describe('The nextCursor from a previous call.'),
  }),
  outputs: z.object({
    summary: z.string().describe('Readable rollup of this page. Safe to quote when answering.'),
    events: z.array(settlementEventSchema),
    rejected: z.number().describe('Rows on this page that could not be read.'),
    scannedAfter: z.string().nullable().describe('The date window actually requested.'),
    scannedBefore: z.string().nullable(),
    complete: z
      .boolean()
      .describe(
        'True only when the whole requested window has been paged. False means this is a ' +
          'partial answer — never present a partial membership as a deposit total.'
      ),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
  exampleOutput: {
    summary:
      '1 settlement event for deposit I5Y8PHAWWSSS2WJ. Event types: loan_capture. This is the ' +
      'last page of the range.',
    events: [exampleSettlementEvent],
    rejected: 0,
    scannedAfter: '2026-09-14',
    scannedBefore: '2026-09-16',
    complete: true,
    nextCursor: null,
    hasMore: false,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: listAffirmSettlementEventsExecute,
  agent: {
    toolsetSlug: 'affirm.settlements',
    idempotent: true,
    surfaces: ['internal', 'builder'],
  },
})
