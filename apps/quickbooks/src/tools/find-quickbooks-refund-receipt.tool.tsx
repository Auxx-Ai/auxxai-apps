// src/tools/find-quickbooks-refund-receipt.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksRefundReceiptExecute from './find-quickbooks-refund-receipt.tool.server'

export const findQuickbooksRefundReceiptTool = defineTool({
  id: 'find_quickbooks_refund_receipt',
  name: 'Find QuickBooks refund receipt',
  description:
    'Look up refund receipts by exact document number. Use before create_quickbooks_refund_receipt to check whether it was already posted.',
  icon: quickbooksIcon,
  inputs: z.object({
    docNumber: z.string().describe('Exact document number.'),
    limit: z.number().int().positive().max(1000).optional().describe('Default 20.'),
  }),
  outputs: z.object({
    refundReceipts: z.array(
      z.object({
        refundReceiptId: z.string(),
        docNumber: z.string().nullable(),
        txnDate: z.string().nullable(),
        totalAmt: z.number(),
        syncToken: z.string(),
      })
    ),
  }),
  exampleOutput: {
    refundReceipts: [
      {
        refundReceiptId: '52',
        docNumber: 'AUXX-RR-20260818',
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
  execute: findQuickbooksRefundReceiptExecute,
})
