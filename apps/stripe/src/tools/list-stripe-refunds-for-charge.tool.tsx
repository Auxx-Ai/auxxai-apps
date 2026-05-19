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
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: listStripeRefundsForChargeExecute,
})
