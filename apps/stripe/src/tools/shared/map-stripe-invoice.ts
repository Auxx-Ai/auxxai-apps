// src/tools/shared/map-stripe-invoice.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { buildCustomerRef, type NestedCustomerRef } from './customer-ref'
import { isoFromUnix } from './iso'

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'

export interface MappedStripeInvoice {
  invoiceId: string
  number: string | null
  status: InvoiceStatus
  customer: NestedCustomerRef
  subscriptionId: string | null
  amountDue: number
  amountPaid: number
  currency: string
  dueDate: string | null
  hostedInvoiceUrl: string | null
  pdfUrl: string | null
  created: string
}

export async function mapStripeInvoice(
  raw: any,
  ctx: ToolExecuteContext | undefined
): Promise<MappedStripeInvoice> {
  const customer = await buildCustomerRef(ctx, raw.customer)
  return {
    invoiceId: raw.id,
    number: raw.number ?? null,
    status: (raw.status as InvoiceStatus) ?? 'draft',
    customer,
    subscriptionId:
      typeof raw.subscription === 'string' ? raw.subscription : (raw.subscription?.id ?? null),
    amountDue: Number(raw.amount_due ?? 0),
    amountPaid: Number(raw.amount_paid ?? 0),
    currency: raw.currency ?? '',
    dueDate: isoFromUnix(raw.due_date),
    hostedInvoiceUrl: raw.hosted_invoice_url ?? null,
    pdfUrl: raw.invoice_pdf ?? null,
    created: isoFromUnix(raw.created) ?? new Date(0).toISOString(),
  }
}
