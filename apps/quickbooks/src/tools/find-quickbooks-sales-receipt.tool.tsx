// src/tools/find-quickbooks-sales-receipt.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksSalesReceiptExecute from './find-quickbooks-sales-receipt.tool.server'

export const findQuickbooksSalesReceiptTool = defineTool({
  id: 'find_quickbooks_sales_receipt',
  name: 'Find QuickBooks sales receipt',
  description:
    'Look up sales receipts by exact document number. Use before create_quickbooks_sales_receipt to check whether it was already posted.',
  icon: quickbooksIcon,
  inputs: z.object({
    docNumber: z.string().describe('Exact document number.'),
    limit: z.number().int().positive().max(1000).optional().describe('Default 20.'),
  }),
  outputs: z.object({
    salesReceipts: z.array(
      z.object({
        salesReceiptId: z.string(),
        docNumber: z.string().nullable(),
        txnDate: z.string().nullable(),
        totalAmt: z.number(),
        syncToken: z.string(),
      })
    ),
  }),
  exampleOutput: {
    salesReceipts: [
      {
        salesReceiptId: '16',
        docNumber: 'AUXX-FUL-20260818',
        txnDate: '2026-08-18',
        totalAmt: 35.0,
        syncToken: '0',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: findQuickbooksSalesReceiptExecute,
})
