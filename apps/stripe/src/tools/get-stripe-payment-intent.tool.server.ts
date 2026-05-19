// src/tools/get-stripe-payment-intent.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import {
  type MappedStripePaymentIntent,
  mapStripePaymentIntent,
} from './shared/map-stripe-payment-intent'

interface GetStripePaymentIntentInput {
  paymentIntentId: string
}

interface GetStripePaymentIntentOutput {
  paymentIntent: MappedStripePaymentIntent
}

export default async function getStripePaymentIntent(
  input: GetStripePaymentIntentInput,
  ctx: ToolExecuteContext
): Promise<GetStripePaymentIntentOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('GET', `/payment_intents/${input.paymentIntentId}`, apiKey)
  return { paymentIntent: await mapStripePaymentIntent(raw, ctx) }
}
