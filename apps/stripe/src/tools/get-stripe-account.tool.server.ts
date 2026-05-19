// src/tools/get-stripe-account.tool.server.ts

import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'

interface GetStripeAccountOutput {
  accountId: string
  businessName: string | null
  country: string
  defaultCurrency: string
  livemode: boolean
  email: string | null
}

export default async function getStripeAccount(): Promise<GetStripeAccountOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const account = await stripeApi<any>('GET', '/account', apiKey)
  return {
    accountId: account.id,
    businessName:
      account.business_profile?.name ?? account.settings?.dashboard?.display_name ?? null,
    country: account.country ?? '',
    defaultCurrency: account.default_currency ?? '',
    livemode: Boolean(account.livemode),
    email: account.email ?? null,
  }
}
