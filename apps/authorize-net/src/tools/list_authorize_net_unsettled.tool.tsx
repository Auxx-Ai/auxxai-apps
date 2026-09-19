// src/tools/list_authorize_net_unsettled.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import authorizeNetIcon from '../assets/authorize-net.png'
import listAuthorizeNetUnsettledExecute from './list_authorize_net_unsettled.tool.server'
import { exampleUnsettledTransaction, unsettledTransactionSchema } from './shared/schemas'

export const listAuthorizeNetUnsettledTool = defineTool({
  id: 'list_authorize_net_unsettled',
  name: 'List Authorize.net unsettled transactions',
  description:
    'List Authorize.net transactions that have been captured but are NOT yet in a settled ' +
    'batch — money on its way, not money in the bank. These join a batch when the acquirer ' +
    'next settles, and only then does list_authorize_net_batches show them. Amounts are gross ' +
    'and carry no fee: the acquirer bills card fees on a monthly statement, and a batch total ' +
    'is only ever the sum of its per-card-brand statistics. Returns no customer name, email or ' +
    'address. READ-ONLY.',
  icon: authorizeNetIcon,
  inputs: z.object({
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
    transactions: z.array(unsettledTransactionSchema),
    rejected: z.number().describe('Rows that could not be read.'),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean().describe('True when more pages remain.'),
    total: z.number().describe('totalNumInResultSet — how many are unsettled in all.'),
  }),
  exampleOutput: {
    summary:
      '1 unsettled Authorize.net transaction of 1 in total. Statuses: capturedPendingSettlement. ' +
      'This is money not yet in the bank. This is the last page.',
    transactions: [exampleUnsettledTransaction],
    rejected: 0,
    nextCursor: null,
    hasMore: false,
    total: 1,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 30000 },
  execute: listAuthorizeNetUnsettledExecute,
  agent: {
    toolsetSlug: 'authorize_net.settlements',
    idempotent: true,
    surfaces: ['internal', 'builder'],
  },
})
