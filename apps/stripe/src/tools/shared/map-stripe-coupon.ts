// src/tools/shared/map-stripe-coupon.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export type CouponDuration = 'once' | 'forever' | 'repeating'

export interface MappedStripeCoupon {
  couponId: string
  name: string | null
  percentOff: number | null
  amountOff: number | null
  currency: string | null
  duration: CouponDuration
  durationInMonths: number | null
  valid: boolean
  timesRedeemed: number
}

export function mapStripeCoupon(raw: any): MappedStripeCoupon {
  return {
    couponId: raw.id,
    name: raw.name ?? null,
    percentOff: typeof raw.percent_off === 'number' ? raw.percent_off : null,
    amountOff: typeof raw.amount_off === 'number' ? raw.amount_off : null,
    currency: raw.currency ?? null,
    duration: (raw.duration as CouponDuration) ?? 'once',
    durationInMonths: typeof raw.duration_in_months === 'number' ? raw.duration_in_months : null,
    valid: Boolean(raw.valid),
    timesRedeemed: Number(raw.times_redeemed ?? 0),
  }
}
