// src/tools/create-quickbooks-deposit.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksDepositExecute from './create-quickbooks-deposit.tool.server'

const lineSchema = z.object({
  accountId: z.string().describe('QuickBooks AccountRef.Id this deposit line is drawn from.'),
  amountMinor: z
    .number()
    .int()
    .describe(
      'Amount in MINOR UNITS (cents), SIGNED. Positive for the gross amount, negative for a fee line.'
    )
    .refine((v) => v !== 0, 'amountMinor must not be zero.'),
  memo: z.string().optional(),
})

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const createQuickbooksDepositTool = defineTool({
  id: 'create_quickbooks_deposit',
  name: 'Create QuickBooks deposit',
  description:
    'Post a bank deposit to QuickBooks — a payout or a bank deposit document. Each line is signed; a processor fee is a negative line. Amounts are in minor units (cents).',
  icon: quickbooksIcon,
  inputs: z.object({
    depositToAccountId: z
      .string()
      .describe('QuickBooks AccountRef.Id the funds land in (a bank account).'),
    lines: z.array(lineSchema).min(1).describe('At least one line. A negative line is a fee.'),
    txnDate: z.string().optional().describe('YYYY-MM-DD. Defaults to the QuickBooks server date.'),
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
        'Idempotency key, max 50 chars. A repeat request with the same key returns the original deposit instead of posting again.'
      ),
  }),
  outputs: z.object({
    depositId: z.string(),
    txnDate: z.string().nullable(),
    totalAmt: z.number(),
    syncToken: z.string(),
  }),
  exampleOutput: {
    depositId: '73',
    txnDate: '2026-08-18',
    totalAmt: 998.5,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksDepositExecute,
})
