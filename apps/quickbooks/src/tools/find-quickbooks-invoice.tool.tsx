// src/tools/find-quickbooks-invoice.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksInvoiceExecute from './find-quickbooks-invoice.tool.server'

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const findQuickbooksInvoiceTool = defineTool({
  id: 'find_quickbooks_invoice',
  name: 'Find QuickBooks invoice',
  description:
    'Look up invoices by exact document number. Use before create_quickbooks_invoice to check whether it was already posted.',
  icon: quickbooksIcon,
  inputs: z.object({
    docNumber: z.string().describe('Exact document number.'),
    limit: z.number().int().positive().max(1000).optional().describe('Default 20.'),
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
  }),
  exampleOutput: {
    invoices: [
      {
        invoiceId: '244',
        docNumber: 'AUXX-INV-20260818',
        customerId: '58',
        customerName: 'Acme Corp',
        txnDate: '2026-08-18',
        dueDate: '2026-09-17',
        totalAmt: 1500,
        balance: 1500,
        status: 'Open',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: findQuickbooksInvoiceExecute,
})
