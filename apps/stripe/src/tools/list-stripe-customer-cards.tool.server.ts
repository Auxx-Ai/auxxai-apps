// src/tools/list-stripe-customer-cards.tool.server.ts

import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCard, mapStripeCard } from './shared/map-stripe-card'

interface ListStripeCustomerCardsInput {
  stripeCustomerId: string
}

interface ListStripeCustomerCardsOutput {
  cards: MappedStripeCard[]
}

export default async function listStripeCustomerCards(
  input: ListStripeCustomerCardsInput
): Promise<ListStripeCustomerCardsOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = await stripeApi<any>('GET', `/customers/${input.stripeCustomerId}`, apiKey)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await stripeApi<any>(
    'GET',
    `/customers/${input.stripeCustomerId}/sources`,
    apiKey,
    { qs: { object: 'card', limit: '100' } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards = (response.data ?? []).map((raw: any) => mapStripeCard(raw, customer))
  return { cards }
}
