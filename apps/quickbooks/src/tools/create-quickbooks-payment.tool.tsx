// src/tools/create-quickbooks-payment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksPaymentExecute from './create-quickbooks-payment.tool.server'

export const createQuickbooksPaymentTool = defineTool({
  id: 'create_quickbooks_payment',
  name: 'Create QuickBooks payment',
  description:
    'Record a customer payment in QuickBooks. The payment can be auto-applied to open invoices, or held as unapplied credit.',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z.string().describe('QuickBooks Customer.Id who made the payment.'),
    totalAmt: z.number().positive().describe('Payment amount.'),
    txnDate: z.string().optional().describe('ISO date (YYYY-MM-DD); defaults to today.'),
    paymentRefNum: z.string().optional().describe('Reference number (check #, txn id).'),
    privateNote: z.string().optional(),
    linkedInvoiceIds: z
      .array(z.string())
      .optional()
      .describe('Invoice ids to apply this payment to. Omit for unapplied credit.'),
  }),
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
