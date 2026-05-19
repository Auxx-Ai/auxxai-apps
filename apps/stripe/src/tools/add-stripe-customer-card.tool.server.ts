// src/tools/add-stripe-customer-card.tool.server.ts

import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCard, mapStripeCard } from './shared/map-stripe-card'

interface AddStripeCustomerCardInput {
  stripeCustomerId: string
  token: string
}

interface AddStripeCustomerCardOutput {
  card: MappedStripeCard
}

export default async function addStripeCustomerCard(
  input: AddStripeCustomerCardInput
): Promise<AddStripeCustomerCardOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = await stripeApi<any>('GET', `/customers/${input.stripeCustomerId}`, apiKey)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('POST', `/customers/${input.stripeCustomerId}/sources`, apiKey, {
    body: { source: input.token },
  })
  return { card: mapStripeCard(raw, customer) }
}
