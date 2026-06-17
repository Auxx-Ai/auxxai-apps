// src/record-actions/search-stripe-options.server.ts

import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from '../tools/shared/connection'
import { mapStripeCustomer } from '../tools/shared/map-stripe-customer'

/** Picker option shape (matches the SDK `SelectOption`: `{ value, label }`). */
interface StripeCustomerOption {
  value: string
  label: string
}

function toOption(raw: unknown): StripeCustomerOption {
  const c = mapStripeCustomer(raw)
  const name = c.name ?? c.email ?? c.stripeCustomerId
  return { value: c.stripeCustomerId, label: `${name} · ${c.stripeCustomerId}` }
}

/**
 * Resolver for the link dialog's `Forms.picker` (`AsyncOptionPicker`):
 * - **empty query** → seed with the contact's email (exact match) so the picker
 *   opens pre-populated with the obvious candidate(s);
 * - **typed query** → Stripe Search API substring match on email + name.
 *
 * `email` is captured client-side from the contact's `useRecord` data and passed
 * through the picker's `loadOptions` closure.
 */
export default async function searchStripeOptions(
  query: string,
  email: string | null
): Promise<StripeCustomerOption[]> {
  const apiKey = getStripeApiKey()
  const term = (query ?? '').trim()

  if (!term) {
    if (!email) return []
    const res = await stripeApi<{ data: unknown[] }>('GET', '/customers', apiKey, {
      qs: { email, limit: '20' },
    })
    return res.data.map(toOption)
  }

  // Stripe Search query language: `~` is substring match on string fields.
  const escaped = term.replace(/["\\]/g, '\\$&')
  const res = await stripeApi<{ data: unknown[] }>('GET', '/customers/search', apiKey, {
    qs: { query: `email~"${escaped}" OR name~"${escaped}"`, limit: '20' },
  })
  return res.data.map(toOption)
}
