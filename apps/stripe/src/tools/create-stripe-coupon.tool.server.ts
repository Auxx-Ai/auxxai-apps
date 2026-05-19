// src/tools/create-stripe-coupon.tool.server.ts

import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { invalidInput } from './shared/invalid-input'
import { type MappedStripeCoupon, mapStripeCoupon } from './shared/map-stripe-coupon'

interface CreateStripeCouponInput {
  duration: 'once' | 'forever' | 'repeating'
  durationInMonths?: number
  percentOff?: number
  amountOff?: number
  currency?: string
  name?: string
  maxRedemptions?: number
}

interface CreateStripeCouponOutput {
  coupon: MappedStripeCoupon
}

export default async function createStripeCoupon(
  input: CreateStripeCouponInput
): Promise<CreateStripeCouponOutput> {
  // .refine() re-checks — converter strips them.
  if ((input.percentOff ? 1 : 0) + (input.amountOff ? 1 : 0) !== 1) {
    invalidInput('Provide exactly one of percentOff or amountOff.')
  }
  if (input.duration === 'repeating' && !input.durationInMonths) {
    invalidInput('durationInMonths is required when duration=repeating.')
  }
  if (input.amountOff && !input.currency) {
    invalidInput('currency is required when amountOff is set.')
  }

  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = { duration: input.duration }
  if (input.durationInMonths) body.duration_in_months = input.durationInMonths
  if (input.percentOff) body.percent_off = input.percentOff
  if (input.amountOff) body.amount_off = input.amountOff
  if (input.currency) body.currency = input.currency.toLowerCase()
  if (input.name) body.name = input.name
  if (input.maxRedemptions) body.max_redemptions = input.maxRedemptions

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('POST', '/coupons', apiKey, { body })
  return { coupon: mapStripeCoupon(raw) }
}
