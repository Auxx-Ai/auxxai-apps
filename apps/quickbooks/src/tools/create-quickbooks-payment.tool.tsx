// src/tools/create-quickbooks-payment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksPaymentExecute from './create-quickbooks-payment.tool.server'

export const createQuickbooksPaymentInputs = z.object({
  customerId: z.string().describe('QuickBooks Customer.Id who made the payment.'),
  totalAmt: z
    .number()
    .positive()
    .optional()
    .describe('Payment amount, major-unit dollars. Ignored when amountMinor is also given.'),
  amountMinor: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      'Amount in MINOR UNITS (cents). 4999 means $49.99. Wins over `totalAmt` when both are given.'
    ),
  txnDate: z.string().optional().describe('ISO date (YYYY-MM-DD); defaults to today.'),
  paymentRefNum: z.string().optional().describe('Reference number (check #, txn id).'),
  privateNote: z.string().max(4000).optional().describe('Internal memo. NOT filterable.'),
  depositToAccountId: z
    .string()
    .optional()
    .describe('QuickBooks AccountRef.Id the payment is deposited to (bank or Undeposited Funds).'),
  linkedInvoiceIds: z
    .array(z.string())
    .optional()
    .describe(
      'Invoice ids to split this payment across evenly. Omit for unapplied credit. Mutually exclusive with invoiceId.'
    ),
  invoiceId: z
    .string()
    .optional()
    .describe(
      'Apply the FULL payment amount to this one invoice. Mutually exclusive with linkedInvoiceIds.'
    ),
  requestId: z
    .string()
    .max(50)
    .optional()
    .describe(
      'Idempotency key, max 50 chars. A repeat request with the same key returns the original payment instead of posting again.'
    ),
})

export const createQuickbooksPaymentTool = defineTool({
  id: 'create_quickbooks_payment',
  name: 'Create QuickBooks payment',
  description:
    'Record a customer payment in QuickBooks. The payment can be auto-applied to open invoices, or held as unapplied credit.',
  icon: quickbooksIcon,
  inputs: createQuickbooksPaymentInputs,
  outputs: z.object({
    paymentId: z.string(),
    totalAmt: z.number(),
    customerId: z.string(),
    unappliedAmt: z.number(),
    syncToken: z.string(),
  }),
  exampleOutput: {
    paymentId: '332',
    totalAmt: 1000,
    customerId: '58',
    unappliedAmt: 0,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksPaymentExecute,
  agent: { toolsetSlug: 'quickbooks.sales.write' },
})
