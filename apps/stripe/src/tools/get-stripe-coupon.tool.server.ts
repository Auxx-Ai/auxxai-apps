// src/tools/get-stripe-coupon.tool.server.ts

import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCoupon, mapStripeCoupon } from './shared/map-stripe-coupon'

interface GetStripeCouponInput {
  couponId: string
}

interface GetStripeCouponOutput {
  coupon: MappedStripeCoupon
}

export default async function getStripeCoupon(
  input: GetStripeCouponInput
): Promise<GetStripeCouponOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('GET', `/coupons/${input.couponId}`, apiKey)
  return { coupon: mapStripeCoupon(raw) }
}
