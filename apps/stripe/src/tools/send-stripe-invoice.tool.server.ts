// src/tools/send-stripe-invoice.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeInvoice, mapStripeInvoice } from './shared/map-stripe-invoice'

interface SendStripeInvoiceInput {
  invoiceId: string
}

interface SendStripeInvoiceOutput {
  invoice: MappedStripeInvoice
}

export default async function sendStripeInvoice(
  input: SendStripeInvoiceInput,
  ctx: ToolExecuteContext
): Promise<SendStripeInvoiceOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('POST', `/invoices/${input.invoiceId}/send`, apiKey, {
    body: {},
  })
  return { invoice: await mapStripeInvoice(raw, ctx) }
}
