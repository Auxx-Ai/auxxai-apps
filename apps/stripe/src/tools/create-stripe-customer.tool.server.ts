// src/tools/create-stripe-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi, toStripeMetadata } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { invalidInput } from './shared/invalid-input'
import { mapStripeCustomer } from './shared/map-stripe-customer'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface CreateStripeCustomerInput {
  email?: string
  name?: string
  phone?: string
  description?: string
  address?: {
    line1: string
    line2?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
  metadata?: { key: string; value: string }[]
}

interface CreateStripeCustomerOutput {
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
  }
}

export default async function createStripeCustomer(
  input: CreateStripeCustomerInput,
  ctx: ToolExecuteContext
): Promise<CreateStripeCustomerOutput> {
  if (!input.email && !input.name) {
    invalidInput('Provide at least email or name.')
  }

  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {}
  if (input.email) body.email = input.email
  if (input.name) body.name = input.name
  if (input.phone) body.phone = input.phone
  if (input.description) body.description = input.description
  if (input.address) {
    body.address = {
      line1: input.address.line1,
      line2: input.address.line2 || undefined,
      city: input.address.city || undefined,
      state: input.address.state || undefined,
      country: input.address.country || undefined,
      postal_code: input.address.postalCode || undefined,
    }
  }
  if (input.metadata?.length) {
    body.metadata = toStripeMetadata(input.metadata)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('POST', '/customers', apiKey, { body })
  const mapped = mapStripeCustomer(raw)
  const auxxRecordId = await resolveContactRef(mapped.stripeCustomerId)

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
