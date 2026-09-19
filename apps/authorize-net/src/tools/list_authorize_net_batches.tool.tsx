// src/tools/list_authorize_net_batches.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import authorizeNetIcon from '../assets/authorize-net.png'
import listAuthorizeNetBatchesExecute from './list_authorize_net_batches.tool.server'
import { batchSchema, exampleBatch } from './shared/schemas'

export const listAuthorizeNetBatchesTool = defineTool({
  id: 'list_authorize_net_batches',
  name: 'List Authorize.net settled batches',
  description:
    'List Authorize.net settled batches — one row per batch the acquirer settled to the bank, ' +
    'with its settlement time, state and net amount. Authorize.net states NO single batch ' +
    'total: the amount here is the SUM of the per-card-brand statistics (charges less refunds, ' +
    'returned items and chargebacks). No fee is shown because none is on the wire — the ' +
    'acquirer bills card fees on a monthly statement, so a batch settles GROSS. Use ' +
    'list_authorize_net_batch_transactions to see what a batch is made of. READ-ONLY.',
  icon: authorizeNetIcon,
  inputs: z.object({
    after: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe('Earliest settlement date, YYYY-MM-DD. Defaults to 30 days before "before".'),
    before: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe('Latest settlement date, YYYY-MM-DD. Defaults to today.'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe('Readable rollup of this page. Safe to quote directly when answering.'),
    batches: z.array(batchSchema),
    rejected: z.number().describe('Rows that could not be read. Say so rather than implying zero.'),
    hasMore: z
      .boolean()
      .describe('True when the range was cut short. Narrow the dates to see the rest.'),
  }),
  exampleOutput: {
    summary:
      '1 Authorize.net batch settled from 2014-10-24 to 2014-10-24, 12.22 USD in total. ' +
      'Amounts are gross — card fees are billed monthly and are not in these figures.',
    batches: [exampleBatch],
    rejected: 0,
    hasMore: false,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 30000 },
  execute: listAuthorizeNetBatchesExecute,
  // Narrowed off the customer-facing surfaces — see toolsets.ts.
  agent: {
    toolsetSlug: 'authorize_net.settlements',
    idempotent: true,
    surfaces: ['internal', 'builder'],
  },
})
