// src/tools/find-stripe-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { mapStripeCustomer } from './shared/map-stripe-customer'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface FindStripeCustomerInput {
  email: string
}

interface FindStripeCustomerOutput {
  customer: {
    stripeCustomerId: string
    auxxRecordId: string | null
    notImportedReason?: 'NOT_IMPORTED'
    email: string | null
    name: string | null
    phone: string | null
    description: string | null
    delinquent: boolean
    created: string
    livemode: boolean
  } | null
}

export default async function findStripeCustomer(
  input: FindStripeCustomerInput,
  ctx: ToolExecuteContext
): Promise<FindStripeCustomerOutput> {
  const apiKey = getStripeApiKey()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await stripeApi<any>('GET', '/customers', apiKey, {
    qs: { email: input.email, limit: '1' },
  })

  const raw = response?.data?.[0]
  if (!raw) return { customer: null }

  const mapped = mapStripeCustomer(raw)
  const auxxRecordId = await resolveContactRef(ctx, mapped.stripeCustomerId)

  return {
    customer: {
      stripeCustomerId: mapped.stripeCustomerId,
      auxxRecordId,
      notImportedReason: auxxRecordId ? undefined : 'NOT_IMPORTED',
      email: mapped.email,
      name: mapped.name,
      phone: mapped.phone,
      description: mapped.description,
      delinquent: mapped.delinquent,
      created: mapped.created,
      livemode: mapped.livemode,
    },
  }
}
