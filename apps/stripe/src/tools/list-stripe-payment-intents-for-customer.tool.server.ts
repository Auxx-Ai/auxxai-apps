// src/tools/list-stripe-payment-intents-for-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import {
  type MappedStripePaymentIntent,
  mapStripePaymentIntent,
} from './shared/map-stripe-payment-intent'

interface ListStripePaymentIntentsForCustomerInput {
  stripeCustomerId: string
  limit?: number
}

interface ListStripePaymentIntentsForCustomerOutput {
  paymentIntents: MappedStripePaymentIntent[]
  truncated: boolean
}

export default async function listStripePaymentIntentsForCustomer(
  input: ListStripePaymentIntentsForCustomerInput,
  ctx: ToolExecuteContext
): Promise<ListStripePaymentIntentsForCustomerOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 20

  const { data, truncated } = await stripePaginatedGet(
    '/payment_intents',
    apiKey,
    { customer: input.stripeCustomerId },
    { returnAll: false, limit }
  )

  const paymentIntents = await Promise.all(data.map((raw) => mapStripePaymentIntent(raw, ctx)))
  return { paymentIntents, truncated }
}
