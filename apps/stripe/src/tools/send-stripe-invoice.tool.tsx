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
  config: { requiresConnection: true, timeout: 20000 },
  execute: sendStripeInvoiceExecute,
})
