// src/tools/get-quickbooks-deposit.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksDepositExecute from './get-quickbooks-deposit.tool.server'

export const getQuickbooksDepositTool = defineTool({
  id: 'get_quickbooks_deposit',
  name: 'Get QuickBooks deposit',
  description:
    'Fetch a QuickBooks deposit by id. Answers NotFound rather than throwing when it is gone.',
  icon: quickbooksIcon,
  inputs: z.object({
    depositId: z.string().describe('QuickBooks Deposit.Id.'),
  }),
  outputs: z.union([
    z.object({
      status: z.literal('Found'),
      depositId: z.string(),
      txnDate: z.string().nullable(),
      totalAmt: z.number(),
      syncToken: z.string(),
      depositToAccountId: z.string().nullable().describe('The bank account it landed in.'),
      lines: z.array(
        z.object({
          amount: z.number(),
          accountId: z
            .string()
            .nullable()
            .describe('The account a coded line credits; null on a line that deposits a payment.'),
          linkedTxns: z
            .array(z.object({ txnId: z.string(), txnType: z.string() }))
            .describe('What the line deposits, e.g. a Payment or Sales Receipt.'),
        })
      ),
    }),
    z.object({ status: z.literal('NotFound') }),
  ]),
  exampleOutput: {
    status: 'Found',
    depositId: '73',
    txnDate: '2026-08-18',
    totalAmt: 998.5,
    syncToken: '0',
    depositToAccountId: '35',
    lines: [{ amount: 998.5, accountId: null, linkedTxns: [{ txnId: '71', txnType: 'Payment' }] }],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksDepositExecute,
})
