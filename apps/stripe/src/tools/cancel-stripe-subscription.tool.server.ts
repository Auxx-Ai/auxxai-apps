// src/tools/cancel-stripe-subscription.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import {
  type MappedStripeSubscription,
  mapStripeSubscription,
} from './shared/map-stripe-subscription'

interface CancelStripeSubscriptionInput {
  subscriptionId: string
  cancelAtPeriodEnd?: boolean
  cancellationReason?: string
}

interface CancelStripeSubscriptionOutput {
  subscription: MappedStripeSubscription
}

export default async function cancelStripeSubscription(
  input: CancelStripeSubscriptionInput,
  ctx: ToolExecuteContext
): Promise<CancelStripeSubscriptionOutput> {
  const apiKey = getStripeApiKey()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raw: any
  if (input.cancelAtPeriodEnd) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: Record<string, any> = { cancel_at_period_end: true }
    if (input.cancellationReason) {
      body.metadata = { cancellation_reason: input.cancellationReason }
    }
    raw = await stripeApi('POST', `/subscriptions/${input.subscriptionId}`, apiKey, { body })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: Record<string, any> = {}
    if (input.cancellationReason) {
      body.cancellation_details = { comment: input.cancellationReason }
    }
    raw = await stripeApi('DELETE', `/subscriptions/${input.subscriptionId}`, apiKey, {
      body: Object.keys(body).length ? body : undefined,
    })
  }

  return { subscription: await mapStripeSubscription(raw, ctx) }
}
