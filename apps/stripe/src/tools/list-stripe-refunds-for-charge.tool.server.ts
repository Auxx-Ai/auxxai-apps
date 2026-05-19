// src/tools/list-stripe-refunds-for-charge.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi, stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeRefund, mapStripeRefund } from './shared/map-stripe-refund'

interface ListStripeRefundsForChargeInput {
  chargeId: string
  limit?: number
}

interface ListStripeRefundsForChargeOutput {
  refunds: MappedStripeRefund[]
  truncated: boolean
}

export default async function listStripeRefundsForCharge(
  input: ListStripeRefundsForChargeInput,
  ctx: ToolExecuteContext
): Promise<ListStripeRefundsForChargeOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 10

  // Fetch parent charge once for the customer ref shared across refunds.
  let customerHint: unknown = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const charge = await stripeApi<any>('GET', `/charges/${input.chargeId}`, apiKey)
    customerHint = charge.customer
  } catch {
    // Best-effort: surface refunds with customer null.
  }

  const { data, truncated } = await stripePaginatedGet(
    '/refunds',
    apiKey,
    { charge: input.chargeId },
    { returnAll: false, limit }
  )

  const refunds = await Promise.all(data.map((raw) => mapStripeRefund(raw, ctx, customerHint)))
  return { refunds, truncated }
}
