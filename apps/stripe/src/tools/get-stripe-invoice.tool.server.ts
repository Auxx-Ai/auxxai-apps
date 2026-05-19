// src/tools/get-stripe-invoice.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeInvoice, mapStripeInvoice } from './shared/map-stripe-invoice'

interface GetStripeInvoiceInput {
  invoiceId: string
}

interface GetStripeInvoiceOutput {
  invoice: MappedStripeInvoice
}

export default async function getStripeInvoice(
  input: GetStripeInvoiceInput,
  ctx: ToolExecuteContext
): Promise<GetStripeInvoiceOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('GET', `/invoices/${input.invoiceId}`, apiKey)
  return { invoice: await mapStripeInvoice(raw, ctx) }
}
