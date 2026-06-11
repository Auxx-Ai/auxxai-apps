// src/tools/get-stripe-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCustomer, mapStripeCustomer } from './shared/map-stripe-customer'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface GetStripeCustomerInput {
  stripeCustomerId: string
}

interface GetStripeCustomerOutput {
  customer: MappedStripeCustomer & {
    auxxRecordId: string | null
    notImportedReason?: 'NOT_IMPORTED'
  }
}

export default async function getStripeCustomer(
  input: GetStripeCustomerInput,
  ctx: ToolExecuteContext
): Promise<GetStripeCustomerOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('GET', `/customers/${input.stripeCustomerId}`, apiKey)
  const mapped = mapStripeCustomer(raw)
  const auxxRecordId = await resolveContactRef(mapped.stripeCustomerId)

  return {
    customer: {
      ...mapped,
      auxxRecordId,
      notImportedReason: auxxRecordId ? undefined : 'NOT_IMPORTED',
    },
  }
}
