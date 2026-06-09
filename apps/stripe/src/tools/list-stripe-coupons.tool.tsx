// src/tools/list-stripe-coupons.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import listStripeCouponsExecute from './list-stripe-coupons.tool.server'

export const couponOutput = z.object({
  couponId: z.string(),
  name: z.string().nullable(),
  percentOff: z.number().nullable(),
  amountOff: z.number().nullable(),
  currency: z.string().nullable(),
  duration: z.enum(['once', 'forever', 'repeating']),
  durationInMonths: z.number().int().nullable(),
  valid: z.boolean(),
  timesRedeemed: z.number().int(),
})

export const listStripeCouponsTool = defineTool({
  id: 'list_stripe_coupons',
  name: 'List Stripe coupons',
  description: 'List coupons on the connected Stripe account.',
  icon: stripeIcon,
  inputs: z.object({
    limit: z.number().int().min(1).max(100).optional().default(50),
  }),
  outputs: z.object({
    coupons: z.array(couponOutput),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    coupons: [
      {
        couponId: 'SUMMER25',
        name: 'Summer Sale 25% Off',
        percentOff: 25,
        amountOff: null,
        currency: null,
        duration: 'once',
        durationInMonths: null,
        valid: true,
        timesRedeemed: 42,
      },
    ],
    truncated: false,
  },
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: listStripeCouponsExecute,
  agent: { toolsetSlug: 'stripe.coupons.read' },
})
