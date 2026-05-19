// actions/create-coupon/create-coupon.server.ts

import type { WorkflowExecuteFunction } from '@auxx/sdk'
import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, throwConnectionNotFound } from '../../blocks/stripe/shared/stripe-api'
import type { createCouponSchema } from './create-coupon-schema'

const createCouponExecute: WorkflowExecuteFunction<typeof createCouponSchema> = async (input) => {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  const body: Record<string, any> = {
    duration: input.duration,
  }

  if (input.discountType === 'percent') {
    if (!input.percentOff) {
      throw new Error('Percent off is required for percentage discounts')
    }
    body.percent_off = input.percentOff
  } else {
    if (!input.amountOff) {
      throw new Error('Amount off is required for fixed amount discounts')
    }
    body.amount_off = input.amountOff
    body.currency = 'usd'
  }

  const result = await stripeApi<any>('POST', '/coupons', apiKey, { body })

  return {
    couponCode: result.id,
    percentOff: String(result.percent_off ?? ''),
    amountOff: String(result.amount_off ?? ''),
    duration: result.duration,
    valid: String(result.valid),
  }
}

export default createCouponExecute
