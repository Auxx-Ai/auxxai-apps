// src/tools/remove-stripe-customer-card.tool.server.ts

import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'

interface RemoveStripeCustomerCardInput {
  stripeCustomerId: string
  cardId: string
}

interface RemoveStripeCustomerCardOutput {
  cardId: string
  deleted: boolean
}

export default async function removeStripeCustomerCard(
  input: RemoveStripeCustomerCardInput
): Promise<RemoveStripeCustomerCardOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>(
    'DELETE',
    `/customers/${input.stripeCustomerId}/sources/${input.cardId}`,
    apiKey
  )
  return {
    cardId: raw.id ?? input.cardId,
    deleted: Boolean(raw.deleted),
  }
}
