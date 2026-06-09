// src/tools/get-stripe-charge.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripeChargeExecute from './get-stripe-charge.tool.server'

export const chargeOutput = z.object({
  chargeId: z.string(),
  amount: z.number().describe('Amount in the smallest currency unit (e.g. cents).'),
  currency: z.string(),
  status: z.enum(['succeeded', 'pending', 'failed']),
  paid: z.boolean(),
  refunded: z.boolean(),
  amountRefunded: z.number(),
  customer: z.object({
    stripeCustomerId: z.string().nullable(),
    auxxRecordId: refs.entity('contact').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
  }),
  description: z.string().nullable(),
  receiptUrl: z.string().url().nullable(),
  created: z.string(),
  livemode: z.boolean(),
})

export const getStripeChargeTool = defineTool({
  id: 'get_stripe_charge',
  name: 'Get Stripe charge',
  description: 'Fetch a Stripe charge by id (ch_*). Returns the charge with a nested customer ref.',
  icon: stripeIcon,
  inputs: z.object({
    chargeId: z.string().describe('Stripe charge id (ch_*).'),
  }),
  outputs: z.object({ charge: chargeOutput }),
  exampleOutput: {
    charge: {
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
  },
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeChargeExecute,
  agent: { toolsetSlug: 'stripe.charges.read' },
})
