// src/tools/create-quickbooks-invoice.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksInvoiceExecute from './create-quickbooks-invoice.tool.server'

export const createQuickbooksInvoiceTool = defineTool({
  id: 'create_quickbooks_invoice',
  name: 'Create QuickBooks invoice',
  description:
    'Create a QuickBooks invoice for a customer. Use find_quickbooks_customer to resolve the customerId first, and list_quickbooks_items to resolve item ids.',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z
      .string()
      .describe('QuickBooks Customer.Id. Resolve via find_quickbooks_customer.'),
    lines: z
      .array(
        z.object({
          itemId: z.string().describe('QuickBooks Item.Id. Resolve via list_quickbooks_items.'),
          amount: z
            .number()
            .positive()
            .optional()
            .describe('Major-unit dollars. Ignored when amountMinor is also given.'),
          amountMinor: z
            .number()
            .int()
            .positive()
            .optional()
            .describe(
              'Amount in MINOR UNITS (cents). 4999 means $49.99. Wins over `amount` when both are given.'
            ),
          quantity: z.number().positive().default(1),
          description: z.string().optional(),
        })
      )
      .min(1)
      .describe('At least one line item required. Provide amountMinor or amount per line.'),
    docNumber: z
      .string()
      .max(21)
      .optional()
      .describe('Custom invoice number, max 21 chars; omit to auto-assign.'),
    dueDate: z.string().optional().describe('ISO date (YYYY-MM-DD).'),
    txnDate: z.string().optional().describe('Transaction date; defaults to today.'),
    billEmail: z.string().email().optional().describe('Email to send invoice to.'),
    customerMemo: z.string().optional().describe('Customer-facing memo.'),
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
        'Idempotency key, max 50 chars. A repeat request with the same key returns the original invoice instead of posting again.'
      ),
  }),
  outputs: z.object({
    invoiceId: z.string(),
    docNumber: z.string().nullable(),
    totalAmt: z.number(),
    balance: z.number(),
    dueDate: z.string().nullable(),
    syncToken: z.string(),
  }),
  exampleOutput: {
    invoiceId: '244',
    docNumber: '1038',
    totalAmt: 1500,
    balance: 1500,
    dueDate: '2026-07-08',
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksInvoiceExecute,
  agent: { toolsetSlug: 'quickbooks.sales.write' },
})
