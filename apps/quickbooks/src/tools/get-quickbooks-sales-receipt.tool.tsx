// src/tools/get-quickbooks-sales-receipt.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksSalesReceiptExecute from './get-quickbooks-sales-receipt.tool.server'

export const getQuickbooksSalesReceiptTool = defineTool({
  id: 'get_quickbooks_sales_receipt',
  name: 'Get QuickBooks sales receipt',
  description:
    'Fetch a QuickBooks sales receipt by id. Answers NotFound rather than throwing when the receipt is gone.',
  icon: quickbooksIcon,
  inputs: z.object({
    salesReceiptId: z.string().describe('QuickBooks SalesReceipt.Id.'),
  }),
  outputs: z.union([
    z.object({
      status: z.literal('Found'),
      salesReceiptId: z.string(),
      docNumber: z.string().nullable(),
      txnDate: z.string().nullable(),
      totalAmt: z.number(),
      syncToken: z.string(),
    }),
    z.object({ status: z.literal('NotFound') }),
  ]),
  exampleOutput: {
    status: 'Found',
    salesReceiptId: '16',
    docNumber: 'AUXX-FUL-20260818',
    txnDate: '2026-08-18',
    totalAmt: 35.0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksSalesReceiptExecute,
})
