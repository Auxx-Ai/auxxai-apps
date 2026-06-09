// src/tools/list-stripe-invoices-for-customer.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripeInvoicesForCustomerExecute from './list-stripe-invoices-for-customer.tool.server'
import { invoiceOutput } from './get-stripe-invoice.tool'

export const listStripeInvoicesForCustomerTool = defineTool({
  id: 'list_stripe_invoices_for_customer',
  name: 'List Stripe invoices for customer',
  description: 'List invoices for a specific Stripe customer, optionally filtered by status.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string(),
    status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']).optional(),
    limit: z.number().int().min(1).max(100).optional().default(20),
  }),
  outputs: z.object({
    invoices: z.array(invoiceOutput),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    invoices: [
      {
        invoiceId: 'in_1MrabC2eZvKYlo2C',
        number: 'INV-0042',
        status: 'paid',
        customer: {
          stripeCustomerId: 'cus_Nffr3xQ1aBcDeF',
          auxxRecordId: null,
        },
        subscriptionId: 'sub_1MrabC2eZvKYlo2C',
        amountDue: 2400,
        amountPaid: 2400,
        currency: 'usd',
        dueDate: '2026-06-15T00:00:00Z',
        hostedInvoiceUrl: 'https://invoice.stripe.com/i/acct_1Mr/test_inv_0042',
        pdfUrl: 'https://invoice.stripe.com/i/acct_1Mr/test_inv_0042/pdf',
        created: '2026-06-01T16:30:00Z',
      },
    ],
    truncated: false,
  },
  config: { requiresConnection: true, timeout: 15000, idempotent: true },
  execute: listStripeInvoicesForCustomerExecute,
  agent: { toolsetSlug: 'stripe.invoices.read' },
})
