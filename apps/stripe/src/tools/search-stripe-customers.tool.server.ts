// src/tools/search-stripe-customers.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi, stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { invalidInput } from './shared/invalid-input'
import { mapStripeCustomer } from './shared/map-stripe-customer'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface SearchStripeCustomersInput {
  email?: string
  query?: string
  limit?: number
}

interface SearchStripeCustomersOutput {
  customers: {
    stripeCustomerId: string
    auxxRecordId: string | null
    notImportedReason?: 'NOT_IMPORTED'
    email: string | null
    name: string | null
    phone: string | null
    delinquent: boolean
    created: string
    livemode: boolean
  }[]
  truncated: boolean
}

export default async function searchStripeCustomers(
  input: SearchStripeCustomersInput,
  ctx: ToolExecuteContext
): Promise<SearchStripeCustomersOutput> {
  // .refine() re-check — the converter strips it.
  if (Boolean(input.email) === Boolean(input.query)) {
    invalidInput('Provide exactly one of email or query.')
  }

  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raws: any[] = []
  let truncated = false

  if (input.email) {
    const { data, truncated: tr } = await stripePaginatedGet(
      '/customers',
      apiKey,
      { email: input.email },
      { returnAll: false, limit }
    )
    raws = data
    truncated = tr
  } else if (input.query) {
    // Stripe Search API — single page, cursor not used.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await stripeApi<any>('GET', '/customers/search', apiKey, {
      qs: { query: input.query, limit: String(Math.min(limit, 100)) },
    })
    raws = response?.data ?? []
    truncated = Boolean(response?.has_more)
  }

  const customers = await Promise.all(
    raws.map(async (raw) => {
      const mapped = mapStripeCustomer(raw)
      const auxxRecordId = await resolveContactRef(ctx, mapped.stripeCustomerId)
      return {
        stripeCustomerId: mapped.stripeCustomerId,
        auxxRecordId,
        notImportedReason: auxxRecordId ? undefined : ('NOT_IMPORTED' as const),
        email: mapped.email,
        name: mapped.name,
        phone: mapped.phone,
        delinquent: mapped.delinquent,
        created: mapped.created,
        livemode: mapped.livemode,
      }
    })
  )

  return { customers, truncated }
}
