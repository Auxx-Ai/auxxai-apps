// src/tools/list_affirm_charges.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import affirmIcon from '../assets/affirm.png'
import listAffirmChargesExecute from './list_affirm_charges.tool.server'
import { chargeSchema, exampleCharge } from './shared/schemas'

export const listAffirmChargesTool = defineTool({
  id: 'list_affirm_charges',
  name: 'List Affirm charges',
  description:
    'List Affirm charges — what a customer financed, its status and how much of it has been ' +
    'refunded. Amounts are exact decimals. This returns NO customer name, email or address. ' +
    'Use get_affirm_charge for one charge with its event history and the Shopify payment ' +
    'session it belongs to. READ-ONLY: this never captures, refunds or voids anything.',
  icon: affirmIcon,
  inputs: z.object({
    after: z
      .string()
      .optional()
      .describe('Earliest charge creation time, ISO-8601, e.g. 2026-09-01T00:00:00Z.'),
    before: z.string().optional().describe('Latest charge creation time, ISO-8601.'),
    orderId: z
      .string()
      .optional()
      .describe(
        'Keep only charges with this order_id (the Shopify PaymentSession id). Filtered ' +
          'locally, so it only finds charges inside the requested date range.'
      ),
    limit: z.number().int().min(1).max(200).optional().describe('Rows requested from Affirm.'),
  }),
  outputs: z.object({
    summary: z.string().describe('Readable rollup of this page. Safe to quote when answering.'),
    charges: z.array(chargeSchema),
    rejected: z.number().describe('Charges on this page that could not be read.'),
    hasMore: z
      .boolean()
      .describe('True when more charges match. Say so rather than implying this is everything.'),
  }),
  exampleOutput: {
    summary: '1 Affirm charge. Statuses: captured. This is the last page.',
    charges: [exampleCharge],
    rejected: 0,
    hasMore: false,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: listAffirmChargesExecute,
  agent: {
    toolsetSlug: 'affirm.settlements',
    idempotent: true,
    surfaces: ['internal', 'builder'],
  },
})
