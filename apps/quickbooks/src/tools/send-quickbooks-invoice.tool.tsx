// src/tools/send-quickbooks-invoice.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import sendQuickbooksInvoiceExecute from './send-quickbooks-invoice.tool.server'

export const sendQuickbooksInvoiceTool = defineTool({
  id: 'send_quickbooks_invoice',
  name: 'Send QuickBooks invoice',
  description:
    'Email a QuickBooks invoice to the customer. Side-effect: actually sends an email. Defaults to the invoice BillEmail; pass email to override.',
  icon: quickbooksIcon,
  inputs: z.object({
    invoiceId: z.string().describe('QuickBooks Invoice.Id to send.'),
    email: z.string().email().optional().describe('Override the invoice BillEmail.'),
  }),
  outputs: z.object({
    invoiceId: z.string(),
    emailStatus: z.enum(['EmailSent']),
  }),
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: sendQuickbooksInvoiceExecute,
  agent: { toolsetSlug: 'quickbooks.sales.write' },
})
