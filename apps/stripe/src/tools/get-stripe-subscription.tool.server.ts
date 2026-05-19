// src/tools/get-stripe-subscription.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import {
  type MappedStripeSubscription,
  mapStripeSubscription,
} from './shared/map-stripe-subscription'

interface GetStripeSubscriptionInput {
  subscriptionId: string
}

interface GetStripeSubscriptionOutput {
  subscription: MappedStripeSubscription
}

export default async function getStripeSubscription(
  input: GetStripeSubscriptionInput,
  ctx: ToolExecuteContext
): Promise<GetStripeSubscriptionOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('GET', `/subscriptions/${input.subscriptionId}`, apiKey)
  return { subscription: await mapStripeSubscription(raw, ctx) }
}
