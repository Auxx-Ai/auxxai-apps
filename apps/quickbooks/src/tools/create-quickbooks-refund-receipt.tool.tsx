// src/tools/create-quickbooks-refund-receipt.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksRefundReceiptExecute from './create-quickbooks-refund-receipt.tool.server'

const lineSchema = z.object({
  itemId: z.string().describe('QuickBooks Item.Id. Resolve via find_quickbooks_item.'),
  amountMinor: z
    .number()
    .int()
    .positive()
    .describe('Amount in MINOR UNITS (cents). 4999 means $49.99.'),
  description: z.string().optional(),
  taxCode: z
    .enum(['NON'])
    .optional()
    .describe('Set on the sales-tax line so automated sales tax does not recompute it.'),
})

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const createQuickbooksRefundReceiptTool = defineTool({
  id: 'create_quickbooks_refund_receipt',
  name: 'Create QuickBooks refund receipt',
  description:
    'Post a cash refund to a customer in QuickBooks as a Refund Receipt. Amounts are in minor units (cents).',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z.string().describe('QuickBooks Customer.Id.'),
    lines: z
      .array(lineSchema)
      .min(1)
      .describe('At least one line, mirroring the sale being refunded.'),
    paidFromAccountId: z
      .string()
      .describe('QuickBooks AccountRef.Id the refund is paid from (bank or Undeposited Funds).'),
    txnDate: z.string().optional().describe('YYYY-MM-DD. Defaults to the QuickBooks server date.'),
    docNumber: z
      .string()
      .max(21)
      .optional()
      .describe(
        'Document number, max 21 chars. Filterable — doubles as a duplicate-detection key.'
      ),
    privateNote: z.string().max(4000).optional().describe('Internal memo. NOT filterable.'),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    requestId: z
      .string()
      .max(50)
      .optional()
      .describe(
        'Idempotency key, max 50 chars. A repeat request with the same key returns the original refund instead of posting again.'
      ),
  }),
  outputs: z.object({
    refundReceiptId: z.string(),
    docNumber: z.string().nullable(),
    txnDate: z.string().nullable(),
    totalAmt: z.number(),
    syncToken: z.string(),
  }),
  exampleOutput: {
    refundReceiptId: '52',
    docNumber: 'AUXX-RR-20260818',
    txnDate: '2026-08-18',
    totalAmt: 35.0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksRefundReceiptExecute,
})
