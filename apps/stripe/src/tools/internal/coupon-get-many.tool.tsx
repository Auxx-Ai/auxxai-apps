// src/tools/internal/coupon-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import couponGetManyExecute from './coupon-get-many.tool.server'

export const couponGetManyTool = defineTool({
  id: 'block_stripe_coupon_get_many',
  name: 'Stripe: get many coupons (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: couponGetManyExecute,
})
