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
  config: { requiresConnection: true, timeout: 15000, idempotent: true },
  execute: listStripeChargesForCustomerExecute,
})
