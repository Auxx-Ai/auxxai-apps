// src/tools/get-stripe-payment-intent.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripePaymentIntentExecute from './get-stripe-payment-intent.tool.server'

export const paymentIntentOutput = z.object({
  paymentIntentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum([
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
    'requires_capture',
    'canceled',
    'succeeded',
  ]),
  customer: z.object({
    stripeCustomerId: z.string().nullable(),
    auxxRecordId: refs.entity('contact').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
  }),
  latestChargeId: z.string().nullable(),
  description: z.string().nullable(),
  receiptEmail: z.string().nullable(),
  created: z.string(),
})

export const getStripePaymentIntentTool = defineTool({
  id: 'get_stripe_payment_intent',
  name: 'Get Stripe payment intent',
  description:
    'Fetch a Stripe payment intent by id (pi_*). PaymentIntent is the modern Stripe payment object — prefer this over Charge for accounts using Stripe Checkout or Elements.',
  icon: stripeIcon,
  inputs: z.object({ paymentIntentId: z.string().describe('Stripe payment intent id (pi_*).') }),
  outputs: z.object({ paymentIntent: paymentIntentOutput }),
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripePaymentIntentExecute,
})
