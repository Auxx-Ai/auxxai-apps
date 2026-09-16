// src/tools/list_affirm_settlements.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import affirmIcon from '../assets/affirm.png'
import listAffirmSettlementsExecute from './list_affirm_settlements.tool.server'
import { exampleSettlement, settlementSchema } from './shared/schemas'

export const listAffirmSettlementsTool = defineTool({
  id: 'list_affirm_settlements',
  name: 'List Affirm settlements',
  description:
    'List Affirm settlement deposits — one row per settlement date, each with the deposit_id ' +
    'the merchant sees on their BANK STATEMENT, the amount that reached the bank, and the ' +
    'sales, refunds and fees Affirm reports behind it. Affirm reports fees NEGATIVE; quote the ' +
    'sign as given. Use list_affirm_settlement_events to see what a deposit is made of. ' +
    'READ-ONLY.',
  icon: affirmIcon,
  inputs: z.object({
    after: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe('Earliest settlement date, YYYY-MM-DD.'),
    before: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe('Latest settlement date, YYYY-MM-DD.'),
    limit: z.number().int().min(1).max(250).optional().describe('Rows per page. Defaults to 250.'),
    cursor: z
      .string()
      .optional()
      .describe('The nextCursor from a previous call, to read the following page.'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe('Readable rollup of this page. Safe to quote directly when answering.'),
    settlements: z.array(settlementSchema),
    rejected: z
      .number()
      .describe('Rows on this page that could not be read. Say so rather than implying zero.'),
    nextCursor: z.string().nullable(),
    hasMore: z
      .boolean()
      .describe('True when more pages match. Say so rather than implying this is everything.'),
  }),
  exampleOutput: {
    summary: '2 Affirm deposits from 2026-09-08 to 2026-09-15 in USD. This is the last page.',
    settlements: [
      exampleSettlement,
      {
        depositId: 'PMDM5BIIZE6JASG',
        date: '2026-09-08',
        status: 'paid',
        totalSettled: '3059.99',
        currency: 'USD',
        currencyExponent: 2,
        accountLastFour: null,
        reportedSales: '3197.46',
        reportedRefunds: '0.00',
        reportedFees: '-137.47',
      },
    ],
    rejected: 0,
    nextCursor: null,
    hasMore: false,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: listAffirmSettlementsExecute,
  // Staff-facing. Narrowed off the customer-facing surfaces — see toolsets.ts.
  agent: {
    toolsetSlug: 'affirm.settlements',
    idempotent: true,
    surfaces: ['internal', 'builder'],
  },
})
