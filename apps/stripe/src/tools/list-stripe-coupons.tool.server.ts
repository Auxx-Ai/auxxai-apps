// src/tools/list-stripe-coupons.tool.server.ts

import { stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCoupon, mapStripeCoupon } from './shared/map-stripe-coupon'

interface ListStripeCouponsInput {
  limit?: number
}

interface ListStripeCouponsOutput {
  coupons: MappedStripeCoupon[]
  truncated: boolean
}

export default async function listStripeCoupons(
  input: ListStripeCouponsInput
): Promise<ListStripeCouponsOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 50

  const { data, truncated } = await stripePaginatedGet(
    '/coupons',
    apiKey,
    {},
    {
      returnAll: false,
      limit,
    }
  )

  return { coupons: data.map(mapStripeCoupon), truncated }
}
