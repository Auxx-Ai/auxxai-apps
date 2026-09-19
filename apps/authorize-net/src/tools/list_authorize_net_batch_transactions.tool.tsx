// src/tools/list_authorize_net_batch_transactions.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import authorizeNetIcon from '../assets/authorize-net.png'
import listAuthorizeNetBatchTransactionsExecute from './list_authorize_net_batch_transactions.tool.server'
import { batchTransactionSchema, exampleBatchTransaction } from './shared/schemas'

export const listAuthorizeNetBatchTransactionsTool = defineTool({
  id: 'list_authorize_net_batch_transactions',
  name: 'List Authorize.net batch transactions',
  description:
    'List the transactions inside one settled Authorize.net batch — the charges and refunds ' +
    'that make up what the acquirer deposited. Amounts are gross exact decimals and carry NO ' +
    'fee: the acquirer bills card fees on a monthly statement, so nothing on the wire is ' +
    'netted. The batch’s own total is the sum of its per-card-brand statistics ' +
    '(list_authorize_net_batches), which is what these rows should add up to. Returns no ' +
    'customer name, email or address. READ-ONLY.',
  icon: authorizeNetIcon,
  inputs: z.object({
    batchId: z.string().describe('The batch id from list_authorize_net_batches, e.g. 10198080.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .describe('Rows per page, up to 1000. Defaults to 1000.'),
    cursor: z
      .string()
      .optional()
      .describe('The nextCursor from a previous call, to read the following page.'),
  }),
  outputs: z.object({
    summary: z.string().describe('Readable rollup of this page. Safe to quote when answering.'),
    transactions: z.array(batchTransactionSchema),
    rejected: z.number().describe('Rows that could not be read.'),
    nextCursor: z.string().nullable(),
    hasMore: z
      .boolean()
      .describe('True when more pages remain. Say so rather than implying this is everything.'),
    total: z.number().describe('totalNumInResultSet — how many transactions the batch holds.'),
  }),
  exampleOutput: {
    summary:
      '1 transaction in Authorize.net batch 10198080 of 1 in total. Amounts are gross — card ' +
      'fees are billed monthly and are not deducted here. This is the last page.',
    transactions: [exampleBatchTransaction],
    rejected: 0,
    nextCursor: null,
    hasMore: false,
    total: 1,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 30000 },
  execute: listAuthorizeNetBatchTransactionsExecute,
  agent: {
    toolsetSlug: 'authorize_net.settlements',
    idempotent: true,
    surfaces: ['internal', 'builder'],
  },
})
