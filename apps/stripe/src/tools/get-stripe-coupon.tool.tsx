// src/tools/get-stripe-coupon.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../assets/icon.png'
import getStripeCouponExecute from './get-stripe-coupon.tool.server'
import { couponOutput } from './list-stripe-coupons.tool'

export const getStripeCouponTool = defineTool({
  id: 'get_stripe_coupon',
  name: 'Get Stripe coupon',
  description: 'Fetch a Stripe coupon by id.',
  icon: stripeIcon,
  inputs: z.object({ couponId: z.string() }),
  outputs: z.object({ coupon: couponOutput }),
  config: { requiresConnection: true, timeout: 10000, idempotent: true },
  execute: getStripeCouponExecute,
  agent: { toolsetSlug: 'stripe.coupons.read' },
})
