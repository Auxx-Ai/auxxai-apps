// src/tools/send-stripe-invoice.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import sendStripeInvoiceExecute from './send-stripe-invoice.tool.server'
import { invoiceOutput } from './get-stripe-invoice.tool'

export const sendStripeInvoiceTool = defineTool({
  id: 'send_stripe_invoice',
  name: 'Send Stripe invoice',
  description:
    'Send a Stripe invoice to the customer via email. Invoice must be in status=open or status=draft (drafts will be finalized first by Stripe).',
  icon: stripeIcon,
  inputs: z.object({
    invoiceId: z.string().describe('Stripe invoice id (in_*).'),
  }),
  outputs: z.object({ invoice: invoiceOutput }),
  exampleOutput: {
    invoice: {
      invoiceId: 'in_1MrabC2eZvKYlo2C',
      number: 'INV-0042',
      status: 'open',
      customer: {
        stripeCustomerId: 'cus_Nffr3xQ1aBcDeF',
        auxxRecordId: null,
      },
      subscriptionId: null,
      amountDue: 2400,
      amountPaid: 0,
      currency: 'usd',
      dueDate: '2026-06-15T00:00:00Z',
      hostedInvoiceUrl: 'https://invoice.stripe.com/i/acct_1Mr/test_inv_0042',
      pdfUrl: 'https://invoice.stripe.com/i/acct_1Mr/test_inv_0042/pdf',
      created: '2026-06-01T16:30:00Z',
    },
  },
  config: { requiresConnection: true, timeout: 20000 },
  execute: sendStripeInvoiceExecute,
  agent: { toolsetSlug: 'stripe.invoices.write' },
})
