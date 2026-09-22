// src/tools/create-quickbooks-bill.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksBillExecute from './create-quickbooks-bill.tool.server'

const lineSchema = z.object({
  accountId: z.string().describe('QuickBooks expense/asset AccountRef.Id.'),
  amountMinor: z
    .number()
    .int()
    .positive()
    .describe('Amount in MINOR UNITS (cents). 4999 means $49.99.'),
  description: z.string().optional(),
})

export const createQuickbooksBillInputs = z.object({
  vendorId: z.string().describe('QuickBooks Vendor.Id.'),
  lines: z.array(lineSchema).min(1).describe('At least one expense line.'),
  dueDate: z.string().optional().describe('YYYY-MM-DD.'),
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
      'Idempotency key, max 50 chars. A repeat request with the same key returns the original bill instead of posting again.'
    ),
})

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const createQuickbooksBillTool = defineTool({
  id: 'create_quickbooks_bill',
  name: 'Create QuickBooks bill',
  description:
    'Post a vendor bill to QuickBooks. Lines post straight to an account (AccountBasedExpenseLineDetail), never through an item. Amounts are in minor units (cents).',
  icon: quickbooksIcon,
  inputs: createQuickbooksBillInputs,
  outputs: z.object({
    billId: z.string(),
    docNumber: z.string().nullable(),
    txnDate: z.string().nullable(),
    totalAmt: z.number(),
    balance: z.number(),
    syncToken: z.string(),
  }),
  exampleOutput: {
    billId: '211',
    docNumber: 'AUXX-BILL-20260818',
    txnDate: '2026-08-18',
    totalAmt: 500.0,
    balance: 500.0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksBillExecute,
})
