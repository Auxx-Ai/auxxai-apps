// src/tools/list-stripe-refunds-for-charge.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripeRefundsForChargeExecute from './list-stripe-refunds-for-charge.tool.server'
import { refundOutput } from './get-stripe-refund.tool'

export const listStripeRefundsForChargeTool = defineTool({
  id: 'list_stripe_refunds_for_charge',
  name: 'List Stripe refunds for charge',
  description: 'List refunds on a specific Stripe charge.',
  icon: stripeIcon,
  inputs: z.object({
    chargeId: z.string(),
    limit: z.number().int().min(1).max(100).optional().default(10),
  }),
  outputs: z.object({
    refunds: z.array(refundOutput),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    refunds: [
      {
        refundId: 're_1MrabC2eZvKYlo2C',
        chargeId: 'ch_3MrabC2eZvKYlo2C1',
        amount: 2400,
        currency: 'usd',
        status: 'succeeded',
        reason: 'requested_by_customer',
        customer: {
          stripeCustomerId: 'cus_Nffr3xQ1aBcDeF',
          auxxRecordId: null,
        },
        created: '2026-06-02T10:15:00Z',
      },
    ],
    truncated: false,
  },
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: listStripeRefundsForChargeExecute,
  agent: { toolsetSlug: 'stripe.refunds.read' },
})
