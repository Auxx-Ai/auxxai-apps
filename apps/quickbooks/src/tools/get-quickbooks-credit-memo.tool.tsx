// src/tools/get-quickbooks-credit-memo.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksCreditMemoExecute from './get-quickbooks-credit-memo.tool.server'

export const getQuickbooksCreditMemoTool = defineTool({
  id: 'get_quickbooks_credit_memo',
  name: 'Get QuickBooks credit memo',
  description:
    'Fetch a QuickBooks credit memo by id. Answers NotFound rather than throwing when the memo is gone.',
  icon: quickbooksIcon,
  inputs: z.object({
    creditMemoId: z.string().describe('QuickBooks CreditMemo.Id.'),
  }),
  outputs: z.union([
    z.object({
      status: z.literal('Found'),
      creditMemoId: z.string(),
      docNumber: z.string().nullable(),
      txnDate: z.string().nullable(),
      totalAmt: z.number(),
      balance: z.number(),
      syncToken: z.string(),
    }),
    z.object({ status: z.literal('NotFound') }),
  ]),
  exampleOutput: {
    status: 'Found',
    creditMemoId: '97',
    docNumber: 'AUXX-CM-20260818',
    txnDate: '2026-08-18',
    totalAmt: 35.0,
    balance: 35.0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksCreditMemoExecute,
})
