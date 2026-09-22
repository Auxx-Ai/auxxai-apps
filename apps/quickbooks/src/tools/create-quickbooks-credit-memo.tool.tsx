// src/tools/create-quickbooks-credit-memo.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksCreditMemoExecute from './create-quickbooks-credit-memo.tool.server'

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

export const createQuickbooksCreditMemoInputs = z.object({
  customerId: z.string().describe('QuickBooks Customer.Id.'),
  lines: z.array(lineSchema).min(1).describe('At least one revenue line.'),
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
      'Idempotency key, max 50 chars. A repeat request with the same key returns the original memo instead of posting again.'
    ),
})

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const createQuickbooksCreditMemoTool = defineTool({
  id: 'create_quickbooks_credit_memo',
  name: 'Create QuickBooks credit memo',
  description:
    'Post a credit memo to QuickBooks for a customer — a refund or discount recorded against their account rather than as cash. Amounts are in minor units (cents).',
  icon: quickbooksIcon,
  inputs: createQuickbooksCreditMemoInputs,
  outputs: z.object({
    creditMemoId: z.string(),
    docNumber: z.string().nullable(),
    txnDate: z.string().nullable(),
    totalAmt: z.number(),
    balance: z.number(),
    syncToken: z.string(),
  }),
  exampleOutput: {
    creditMemoId: '97',
    docNumber: 'AUXX-CM-20260818',
    txnDate: '2026-08-18',
    totalAmt: 35.0,
    balance: 35.0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksCreditMemoExecute,
})
