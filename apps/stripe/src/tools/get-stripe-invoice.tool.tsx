// src/tools/get-stripe-invoice.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripeInvoiceExecute from './get-stripe-invoice.tool.server'

export const invoiceOutput = z.object({
  invoiceId: z.string(),
  number: z.string().nullable().describe('Human-facing invoice number (e.g. INV-001).'),
  status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']),
  customer: z.object({
    stripeCustomerId: z.string().nullable(),
    auxxRecordId: refs.entity('contact').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
  }),
  subscriptionId: z.string().nullable(),
  amountDue: z.number(),
  amountPaid: z.number(),
  currency: z.string(),
  dueDate: z.string().nullable(),
  hostedInvoiceUrl: z
    .string()
    .url()
    .nullable()
    .describe('Stripe-hosted invoice URL (HTML, share with customer).'),
  pdfUrl: z.string().url().nullable(),
  created: z.string(),
})

export const getStripeInvoiceTool = defineTool({
  id: 'get_stripe_invoice',
  name: 'Get Stripe invoice',
  description: 'Fetch a Stripe invoice by id (in_*).',
  icon: stripeIcon,
  inputs: z.object({ invoiceId: z.string().describe('Stripe invoice id (in_*).') }),
  outputs: z.object({ invoice: invoiceOutput }),
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeInvoiceExecute,
  agent: { toolsetSlug: 'stripe.invoices.read' },
})
