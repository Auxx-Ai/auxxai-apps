// src/tools/list-stripe-invoices-for-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeInvoice, mapStripeInvoice } from './shared/map-stripe-invoice'

interface ListStripeInvoicesForCustomerInput {
  stripeCustomerId: string
  status?: string
  limit?: number
}

interface ListStripeInvoicesForCustomerOutput {
  invoices: MappedStripeInvoice[]
  truncated: boolean
}

export default async function listStripeInvoicesForCustomer(
  input: ListStripeInvoicesForCustomerInput,
  ctx: ToolExecuteContext
): Promise<ListStripeInvoicesForCustomerOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 20

  const qs: Record<string, string> = { customer: input.stripeCustomerId }
  if (input.status) qs.status = input.status

  const { data, truncated } = await stripePaginatedGet('/invoices', apiKey, qs, {
    returnAll: false,
    limit,
  })

  const invoices = await Promise.all(data.map((raw) => mapStripeInvoice(raw, ctx)))
  return { invoices, truncated }
}
