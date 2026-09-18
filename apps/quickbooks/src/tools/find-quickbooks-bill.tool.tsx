// src/tools/find-quickbooks-bill.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksBillExecute from './find-quickbooks-bill.tool.server'

export const findQuickbooksBillTool = defineTool({
  id: 'find_quickbooks_bill',
  name: 'Find QuickBooks bill',
  description:
    'Look up vendor bills by exact document number. Use before create_quickbooks_bill to check whether it was already posted.',
  icon: quickbooksIcon,
  inputs: z.object({
    docNumber: z.string().describe('Exact document number.'),
    limit: z.number().int().positive().max(1000).optional().describe('Default 20.'),
  }),
  outputs: z.object({
    bills: z.array(
      z.object({
        billId: z.string(),
        docNumber: z.string().nullable(),
        txnDate: z.string().nullable(),
        totalAmt: z.number(),
        balance: z.number(),
        syncToken: z.string(),
      })
    ),
  }),
  exampleOutput: {
    bills: [
      {
        billId: '211',
        docNumber: 'AUXX-BILL-20260818',
        txnDate: '2026-08-18',
        totalAmt: 500.0,
        balance: 500.0,
        syncToken: '0',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: findQuickbooksBillExecute,
})
