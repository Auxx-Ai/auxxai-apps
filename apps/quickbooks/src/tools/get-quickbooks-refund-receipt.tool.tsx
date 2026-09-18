// src/tools/get-quickbooks-refund-receipt.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksRefundReceiptExecute from './get-quickbooks-refund-receipt.tool.server'

export const getQuickbooksRefundReceiptTool = defineTool({
  id: 'get_quickbooks_refund_receipt',
  name: 'Get QuickBooks refund receipt',
  description:
    'Fetch a QuickBooks refund receipt by id. Answers NotFound rather than throwing when it is gone.',
  icon: quickbooksIcon,
  inputs: z.object({
    refundReceiptId: z.string().describe('QuickBooks RefundReceipt.Id.'),
  }),
  outputs: z.union([
    z.object({
      status: z.literal('Found'),
      refundReceiptId: z.string(),
      docNumber: z.string().nullable(),
      txnDate: z.string().nullable(),
      totalAmt: z.number(),
      syncToken: z.string(),
    }),
    z.object({ status: z.literal('NotFound') }),
  ]),
  exampleOutput: {
    status: 'Found',
    refundReceiptId: '52',
    docNumber: 'AUXX-RR-20260818',
    txnDate: '2026-08-18',
    totalAmt: 35.0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksRefundReceiptExecute,
})
