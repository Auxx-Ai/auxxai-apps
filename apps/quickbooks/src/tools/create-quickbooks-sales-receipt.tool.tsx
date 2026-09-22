// src/tools/create-quickbooks-sales-receipt.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksSalesReceiptExecute from './create-quickbooks-sales-receipt.tool.server'

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

export const createQuickbooksSalesReceiptInputs = z.object({
  customerId: z.string().describe('QuickBooks Customer.Id.'),
  lines: z.array(lineSchema).min(1).describe('At least one revenue line.'),
  depositToAccountId: z
    .string()
    .describe('QuickBooks AccountRef.Id the payment is deposited to (bank or Undeposited Funds).'),
  txnDate: z.string().optional().describe('YYYY-MM-DD. Defaults to the QuickBooks server date.'),
  docNumber: z
    .string()
    .max(21)
    .optional()
    .describe('Document number, max 21 chars. Filterable — doubles as a duplicate-detection key.'),
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
      'Idempotency key, max 50 chars. Must be deterministic from the posting identity — a repeat request with the same key returns the original receipt instead of posting again.'
    ),
})

/**
 * Platform-called, not a chat-agent tool: no `agent` key — the export pipeline
 * is the only caller, same posture as create_quickbooks_journal_entry's siblings
 * in this brief.
 */
export const createQuickbooksSalesReceiptTool = defineTool({
  id: 'create_quickbooks_sales_receipt',
  name: 'Create QuickBooks sales receipt',
  description:
    'Post a fully-paid sale to QuickBooks as a Sales Receipt. Use when the customer already paid at the point of sale — otherwise use create_quickbooks_invoice plus create_quickbooks_payment. Amounts are in minor units (cents).',
  icon: quickbooksIcon,
  inputs: createQuickbooksSalesReceiptInputs,
  outputs: z.object({
    salesReceiptId: z.string(),
    docNumber: z.string().nullable(),
    txnDate: z.string().nullable(),
    totalAmt: z.number(),
    syncToken: z.string(),
  }),
  exampleOutput: {
    salesReceiptId: '16',
    docNumber: 'AUXX-FUL-20260818',
    txnDate: '2026-08-18',
    totalAmt: 35.0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksSalesReceiptExecute,
})
