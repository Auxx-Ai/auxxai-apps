// src/tools/list-stripe-payment-intents-for-customer.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripePaymentIntentsForCustomerExecute from './list-stripe-payment-intents-for-customer.tool.server'
import { paymentIntentOutput } from './get-stripe-payment-intent.tool'

export const listStripePaymentIntentsForCustomerTool = defineTool({
  id: 'list_stripe_payment_intents_for_customer',
  name: 'List Stripe payment intents for customer',
  description: 'List payment intents for a specific Stripe customer.',
  icon: stripeIcon,
  inputs: z.object({
    stripeCustomerId: z.string(),
    limit: z.number().int().min(1).max(100).optional().default(20),
  }),
  outputs: z.object({
    paymentIntents: z.array(paymentIntentOutput),
    truncated: z.boolean(),
  }),
  config: { requiresConnection: true, timeout: 15000, idempotent: true },
  execute: listStripePaymentIntentsForCustomerExecute,
})
