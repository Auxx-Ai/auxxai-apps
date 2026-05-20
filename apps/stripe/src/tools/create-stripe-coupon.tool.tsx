// src/tools/create-stripe-coupon.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import createStripeCouponExecute from './create-stripe-coupon.tool.server'
import { couponOutput } from './list-stripe-coupons.tool'

export const createStripeCouponTool = defineTool({
  id: 'create_stripe_coupon',
  name: 'Create Stripe coupon',
  description:
    'Create a new Stripe coupon. Exactly one of percentOff (1-100) or amountOff + currency must be set. durationInMonths is required when duration=repeating.',
  icon: stripeIcon,
  inputs: z
    .object({
      duration: z.enum(['once', 'forever', 'repeating']),
      durationInMonths: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Required when duration=repeating.'),
      percentOff: z.number().min(1).max(100).optional(),
      amountOff: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Amount in the smallest currency unit (e.g. cents).'),
      currency: z
        .string()
        .length(3)
        .optional()
        .describe('Required when amountOff is set. ISO 4217 (e.g. usd).'),
      name: z.string().optional(),
      maxRedemptions: z.number().int().positive().optional(),
    })
    .refine((v) => (v.percentOff ? 1 : 0) + (v.amountOff ? 1 : 0) === 1, {
      message: 'Provide exactly one of percentOff or amountOff.',
    })
    .refine((v) => v.duration !== 'repeating' || Boolean(v.durationInMonths), {
      message: 'durationInMonths is required when duration=repeating.',
    })
    .refine((v) => !v.amountOff || Boolean(v.currency), {
      message: 'currency is required when amountOff is set.',
    }),
  outputs: z.object({ coupon: couponOutput }),
  config: { requiresConnection: true, timeout: 15000 },
  execute: createStripeCouponExecute,
  agent: { toolsetSlug: 'stripe.coupons.write' },
  action: {
    label: 'Create Coupon',
    description: 'Create a Stripe discount coupon to share with a customer',
    color: '#635BFF',
    surface: 'ticket-header',
  },
})
