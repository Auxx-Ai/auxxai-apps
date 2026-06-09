// src/tools/update-quickbooks-invoice.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import updateQuickbooksInvoiceExecute from './update-quickbooks-invoice.tool.server'

export const updateQuickbooksInvoiceTool = defineTool({
  id: 'update_quickbooks_invoice',
  name: 'Update QuickBooks invoice',
  description:
    'Update fields on an existing QuickBooks invoice. NOTE: lines is full-replace — passing lines replaces the entire line array (QuickBooks does not support per-line patch).',
  icon: quickbooksIcon,
  inputs: z.object({
    invoiceId: z.string().describe('QuickBooks Invoice.Id to update.'),
    lines: z
      .array(
        z.object({
          itemId: z.string(),
          amount: z.number().positive(),
          quantity: z.number().positive().default(1),
          description: z.string().optional(),
        })
      )
      .min(1)
      .optional()
      .describe('Full replacement of line items. Omit to keep existing lines.'),
    docNumber: z.string().optional(),
    dueDate: z.string().optional(),
    txnDate: z.string().optional(),
    billEmail: z.string().email().optional(),
    customerMemo: z.string().optional(),
  }),
  outputs: z.object({
    invoiceId: z.string(),
    docNumber: z.string().nullable(),
    totalAmt: z.number(),
    balance: z.number(),
    syncToken: z.string(),
  }),
  exampleOutput: {
    invoiceId: '243',
    docNumber: '1037',
    totalAmt: 1650,
    balance: 650,
    syncToken: '2',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: updateQuickbooksInvoiceExecute,
  agent: { toolsetSlug: 'quickbooks.sales.write' },
})
