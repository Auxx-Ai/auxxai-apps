// src/tools/get-quickbooks-bill.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksBillExecute from './get-quickbooks-bill.tool.server'

export const getQuickbooksBillTool = defineTool({
  id: 'get_quickbooks_bill',
  name: 'Get QuickBooks bill',
  description:
    'Fetch a QuickBooks vendor bill by id. Answers NotFound rather than throwing when it is gone.',
  icon: quickbooksIcon,
  inputs: z.object({
    billId: z.string().describe('QuickBooks Bill.Id.'),
  }),
  outputs: z.union([
    z.object({
      status: z.literal('Found'),
      billId: z.string(),
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
    billId: '211',
    docNumber: 'AUXX-BILL-20260818',
    txnDate: '2026-08-18',
    totalAmt: 500.0,
    balance: 500.0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksBillExecute,
})
