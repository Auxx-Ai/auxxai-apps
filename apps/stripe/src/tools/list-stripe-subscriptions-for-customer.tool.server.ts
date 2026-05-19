// src/tools/list-stripe-subscriptions-for-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import {
  type MappedStripeSubscription,
  mapStripeSubscription,
} from './shared/map-stripe-subscription'

interface ListStripeSubscriptionsForCustomerInput {
  stripeCustomerId: string
  status?: string
  limit?: number
}

interface ListStripeSubscriptionsForCustomerOutput {
  subscriptions: MappedStripeSubscription[]
  truncated: boolean
}

export default async function listStripeSubscriptionsForCustomer(
  input: ListStripeSubscriptionsForCustomerInput,
  ctx: ToolExecuteContext
): Promise<ListStripeSubscriptionsForCustomerOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 20

  const qs: Record<string, string> = { customer: input.stripeCustomerId }
  if (input.status) qs.status = input.status

  const { data, truncated } = await stripePaginatedGet('/subscriptions', apiKey, qs, {
    returnAll: false,
    limit,
  })

  const subscriptions = await Promise.all(data.map((raw) => mapStripeSubscription(raw, ctx)))
  return { subscriptions, truncated }
}
