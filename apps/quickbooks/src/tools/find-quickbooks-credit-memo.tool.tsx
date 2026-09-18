// src/tools/find-quickbooks-credit-memo.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksCreditMemoExecute from './find-quickbooks-credit-memo.tool.server'

export const findQuickbooksCreditMemoTool = defineTool({
  id: 'find_quickbooks_credit_memo',
  name: 'Find QuickBooks credit memo',
  description:
    'Look up credit memos by exact document number. Use before create_quickbooks_credit_memo to check whether it was already posted.',
  icon: quickbooksIcon,
  inputs: z.object({
    docNumber: z.string().describe('Exact document number.'),
    limit: z.number().int().positive().max(1000).optional().describe('Default 20.'),
  }),
  outputs: z.object({
    creditMemos: z.array(
      z.object({
        creditMemoId: z.string(),
        docNumber: z.string().nullable(),
        txnDate: z.string().nullable(),
        totalAmt: z.number(),
        balance: z.number(),
        syncToken: z.string(),
      })
    ),
  }),
  exampleOutput: {
    creditMemos: [
      {
        creditMemoId: '97',
        docNumber: 'AUXX-CM-20260818',
        txnDate: '2026-08-18',
        totalAmt: 35.0,
        balance: 35.0,
        syncToken: '0',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: findQuickbooksCreditMemoExecute,
})
