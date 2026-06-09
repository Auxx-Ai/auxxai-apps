// src/tools/list-stripe-charges-for-customer.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripeChargesForCustomerExecute from './list-stripe-charges-for-customer.tool.server'
import { chargeOutput } from './get-stripe-charge.tool'

export const listStripeChargesForCustomerTool = defineTool({
  id: 'list_stripe_charges_for_customer',
  name: 'List Stripe charges for customer',
  description: 'List charges for a specific Stripe customer. Sorted most-recent first.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string(),
    limit: z.number().int().min(1).max(100).optional().default(20),
  }),
  outputs: z.object({
    charges: z.array(chargeOutput),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    charges: [
      {
        chargeId: 'ch_3MrabC2eZvKYlo2C1',
        amount: 2400,
        currency: 'usd',
        status: 'succeeded',
        paid: true,
        refunded: false,
        amountRefunded: 0,
        customer: {
          stripeCustomerId: 'cus_Nffr3xQ1aBcDeF',
          auxxRecordId: null,
        },
        description: 'Order #1042',
        receiptUrl: 'https://pay.stripe.com/receipts/payment/CAcaFwoVacct_1Mr',
        created: '2026-06-01T16:30:00Z',
        livemode: true,
      },
    ],
    truncated: false,
  },
  config: { requiresConnection: true, timeout: 15000, idempotent: true },
  execute: listStripeChargesForCustomerExecute,
  agent: { toolsetSlug: 'stripe.charges.read' },
})
