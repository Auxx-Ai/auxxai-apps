// src/tools/list-stripe-charges-for-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCharge, mapStripeCharge } from './shared/map-stripe-charge'

interface ListStripeChargesForCustomerInput {
  stripeCustomerId: string
  limit?: number
}

interface ListStripeChargesForCustomerOutput {
  charges: MappedStripeCharge[]
  truncated: boolean
}

export default async function listStripeChargesForCustomer(
  input: ListStripeChargesForCustomerInput,
  ctx: ToolExecuteContext
): Promise<ListStripeChargesForCustomerOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 20

  const { data, truncated } = await stripePaginatedGet(
    '/charges',
    apiKey,
    { customer: input.stripeCustomerId },
    { returnAll: false, limit }
  )

  const charges = await Promise.all(data.map((raw) => mapStripeCharge(raw, ctx)))
  return { charges, truncated }
}
