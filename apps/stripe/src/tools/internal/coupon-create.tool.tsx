// src/tools/internal/coupon-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import couponCreateExecute from './coupon-create.tool.server'

export const couponCreateTool = defineTool({
  id: 'block_stripe_coupon_create',
  name: 'Stripe: create coupon (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: couponCreateExecute,
})
