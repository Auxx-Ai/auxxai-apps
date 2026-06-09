// src/tools/list-stripe-charges.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripeChargesExecute from './list-stripe-charges.tool.server'
import { chargeOutput } from './get-stripe-charge.tool'

export const listStripeChargesTool = defineTool({
  id: 'list_stripe_charges',
  name: 'List Stripe charges',
  description:
    'List recent Stripe charges across the account, optionally bounded by created date and status.',
  icon: stripeIcon,
  inputs: z.object({
    createdAfter: z
      .string()
      .datetime()
      .optional()
      .describe('ISO 8601 lower bound on charge.created (inclusive).'),
    createdBefore: z
      .string()
      .datetime()
      .optional()
      .describe('ISO 8601 upper bound on charge.created (exclusive).'),
    limit: z.number().int().min(1).max(100).optional().default(50),
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
  config: { requiresConnection: true, timeout: 20000, idempotent: true },
  execute: listStripeChargesExecute,
  agent: { toolsetSlug: 'stripe.charges.read' },
})
