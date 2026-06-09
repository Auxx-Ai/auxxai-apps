// src/tools/get-quickbooks-invoice.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksInvoiceExecute from './get-quickbooks-invoice.tool.server'

export const getQuickbooksInvoiceTool = defineTool({
  id: 'get_quickbooks_invoice',
  name: 'Get QuickBooks invoice',
  description:
    'Fetch a QuickBooks invoice by id. Returns line items, balance, status, and Auxx contact/company refs of the linked customer.',
  icon: quickbooksIcon,
  inputs: z.object({
    invoiceId: z.string().describe('QuickBooks Invoice.Id.'),
  }),
  outputs: z.object({
    invoiceId: z.string(),
    docNumber: z.string().nullable(),
    customerId: z.string(),
    customerName: z.string(),
    txnDate: z.string(),
    dueDate: z.string().nullable(),
    totalAmt: z.number(),
    balance: z.number(),
    status: z.enum(['Open', 'PartiallyPaid', 'Paid', 'Voided', 'Overdue']),
    emailStatus: z.enum(['NotSet', 'NeedToSend', 'EmailSent']),
    billEmail: z.string().nullable(),
    customerMemo: z.string().nullable(),
    lines: z.array(
      z.object({
        itemId: z.string().nullable(),
        description: z.string().nullable(),
        amount: z.number(),
        quantity: z.number().nullable(),
      })
    ),
    syncToken: z.string(),
    auxxContactId: refs.entity('contact').nullable(),
    auxxCompanyId: refs.entity('company').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  exampleOutput: {
    invoiceId: '243',
    docNumber: '1037',
    customerId: '58',
    customerName: 'Acme Corp',
    txnDate: '2026-05-20',
    dueDate: '2026-06-19',
    totalAmt: 1500,
    balance: 500,
    status: 'PartiallyPaid',
    emailStatus: 'EmailSent',
    billEmail: 'jane@acmecorp.com',
    customerMemo: 'Thank you for your business.',
    lines: [
      {
        itemId: '12',
        description: 'Consulting services',
        amount: 1200,
        quantity: 8,
      },
      {
        itemId: '15',
        description: 'Onboarding setup',
        amount: 300,
        quantity: 1,
      },
    ],
    syncToken: '1',
    auxxContactId: null,
    auxxCompanyId: null,
    notImportedReason: null,
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksInvoiceExecute,
  agent: { toolsetSlug: 'quickbooks.sales.read' },
})
