// actions/create-coupon/create-coupon.action.ts

import type { QuickAction } from '@auxx/sdk'
import { createCouponSchema } from './create-coupon-schema'
import createCouponExecute from './create-coupon.server'

export const createCouponAction = {
  id: 'create-coupon',
  label: 'Create Coupon',
  description: 'Create a Stripe discount coupon to share with a customer',
  color: '#635BFF',
  schema: createCouponSchema,
  execute: createCouponExecute,
  config: {
    timeout: 15000,
    requiresConnection: true,
  },
} satisfies QuickAction<typeof createCouponSchema>
