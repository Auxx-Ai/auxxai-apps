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
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeChargeExecute,
})
