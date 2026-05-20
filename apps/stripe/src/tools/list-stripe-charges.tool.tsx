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
  config: { requiresConnection: true, timeout: 20000, idempotent: true },
  execute: listStripeChargesExecute,
  agent: { toolsetSlug: 'stripe.charges.read' },
})
