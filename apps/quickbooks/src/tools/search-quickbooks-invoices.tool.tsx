// src/tools/search-quickbooks-invoices.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import searchQuickbooksInvoicesExecute from './search-quickbooks-invoices.tool.server'

export const searchQuickbooksInvoicesTool = defineTool({
  id: 'search_quickbooks_invoices',
  name: 'Search QuickBooks invoices',
  description:
    'Search QuickBooks invoices by customer, status, and date range. Returns a list of summaries — use get_quickbooks_invoice for full detail and line items.',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z.string().optional().describe('Filter by Customer.Id.'),
    status: z
      .enum(['open', 'paid', 'overdue', 'voided', 'all'])
      .default('all')
      .describe('Open = balance > 0; Paid = balance = 0; Overdue = open past due date.'),
    since: z.string().optional().describe('ISO date (YYYY-MM-DD); invoices on/after.'),
    until: z.string().optional().describe('ISO date (YYYY-MM-DD); invoices on/before.'),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  outputs: z.object({
    invoices: z.array(
      z.object({
        invoiceId: z.string(),
        docNumber: z.string().nullable(),
        customerId: z.string(),
        customerName: z.string(),
        txnDate: z.string(),
        dueDate: z.string().nullable(),
        totalAmt: z.number(),
        balance: z.number(),
        status: z.enum(['Open', 'PartiallyPaid', 'Paid', 'Voided', 'Overdue']),
      })
    ),
    hasMore: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchQuickbooksInvoicesExecute,
})
