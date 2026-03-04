import { getOrganizationConnection } from '@auxx/sdk/server'
import { stripeApi, stripePaginatedGet, throwConnectionNotFound } from '../../shared/stripe-api'

export async function executeCoupon(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const apiKey = connection.value

  switch (operation) {
    case 'create': {
      const body: Record<string, any> = {
        duration: input.createCouponDuration,
      }
      if (input.createCouponType === 'percent') {
        body.percent_off = input.createCouponPercentOff
      } else {
        body.amount_off = input.createCouponAmountOff
        body.currency = input.createCouponCurrency
      }

      const result = await stripeApi<any>('POST', '/coupons', apiKey, { body })
      return {
        couponId: result.id,
        percentOff: String(result.percent_off ?? ''),
        amountOff: String(result.amount_off ?? ''),
        currency: result.currency ?? '',
        duration: result.duration,
        valid: String(result.valid),
      }
    }

    case 'getMany': {
      const { data, truncated } = await stripePaginatedGet(
        '/coupons',
        apiKey,
        {},
        {
          returnAll: input.getManyCouponsReturnAll ?? false,
          limit: input.getManyCouponsLimit ?? 50,
        }
      )
      return {
        coupons: data,
        totalCount: String(data.length),
        truncated: String(truncated),
      }
    }

    default:
      throw new Error(`Unknown coupon operation: ${operation}`)
  }
}
