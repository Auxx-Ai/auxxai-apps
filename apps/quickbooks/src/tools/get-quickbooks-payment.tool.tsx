// src/tools/get-quickbooks-payment.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksPaymentExecute from './get-quickbooks-payment.tool.server'

export const getQuickbooksPaymentTool = defineTool({
  id: 'get_quickbooks_payment',
  name: 'Get QuickBooks payment',
  description:
    'Fetch a QuickBooks payment by id. Includes the linked invoice ids the payment clears, plus customer refs.',
  icon: quickbooksIcon,
  inputs: z.object({
    paymentId: z.string().describe('QuickBooks Payment.Id.'),
  }),
  outputs: z.object({
    paymentId: z.string(),
    customerId: z.string(),
    customerName: z.string(),
    txnDate: z.string(),
    totalAmt: z.number(),
    unappliedAmt: z.number(),
    linkedInvoiceIds: z.array(z.string()).describe('Invoice ids cleared by this payment.'),
    paymentMethod: z.string().nullable(),
    paymentRefNum: z.string().nullable(),
    privateNote: z.string().nullable(),
    syncToken: z.string(),
    auxxContactId: refs.entity('contact').nullable(),
    auxxCompanyId: refs.entity('company').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  exampleOutput: {
    paymentId: '331',
    customerId: '58',
    customerName: 'Acme Corp',
    txnDate: '2026-06-02',
    totalAmt: 1000,
    unappliedAmt: 0,
    linkedInvoiceIds: ['243'],
    paymentMethod: 'Check',
    paymentRefNum: '4471',
    privateNote: 'Partial payment on invoice 1037.',
    syncToken: '0',
    auxxContactId: null,
    auxxCompanyId: null,
    notImportedReason: null,
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksPaymentExecute,
  agent: { toolsetSlug: 'quickbooks.sales.read' },
})
