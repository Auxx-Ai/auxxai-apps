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
  config: { requiresConnection: true, timeout: 15000, idempotent: true },
  execute: listStripeInvoicesForCustomerExecute,
})
