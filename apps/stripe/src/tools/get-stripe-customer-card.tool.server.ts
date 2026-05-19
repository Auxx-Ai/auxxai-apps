// src/tools/get-stripe-customer-card.tool.server.ts

import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCard, mapStripeCard } from './shared/map-stripe-card'

interface GetStripeCustomerCardInput {
  stripeCustomerId: string
  cardId: string
}

interface GetStripeCustomerCardOutput {
  card: MappedStripeCard
}

export default async function getStripeCustomerCard(
  input: GetStripeCustomerCardInput
): Promise<GetStripeCustomerCardOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = await stripeApi<any>('GET', `/customers/${input.stripeCustomerId}`, apiKey)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>(
    'GET',
    `/customers/${input.stripeCustomerId}/sources/${input.cardId}`,
    apiKey
  )
  return { card: mapStripeCard(raw, customer) }
}
