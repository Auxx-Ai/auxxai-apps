// src/tools/shared/map-stripe-payment-intent.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { buildCustomerRef, type NestedCustomerRef } from './customer-ref'
import { isoFromUnix } from './iso'

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded'

export interface MappedStripePaymentIntent {
  paymentIntentId: string
  amount: number
  currency: string
  status: PaymentIntentStatus
  customer: NestedCustomerRef
  latestChargeId: string | null
  description: string | null
  receiptEmail: string | null
  created: string
}

export async function mapStripePaymentIntent(
  raw: any,
  ctx: ToolExecuteContext | undefined
): Promise<MappedStripePaymentIntent> {
  const customer = await buildCustomerRef(ctx, raw.customer)
  return {
    paymentIntentId: raw.id,
    amount: Number(raw.amount ?? 0),
    currency: raw.currency ?? '',
    status: (raw.status as PaymentIntentStatus) ?? 'requires_payment_method',
    customer,
    latestChargeId:
      typeof raw.latest_charge === 'string' ? raw.latest_charge : (raw.latest_charge?.id ?? null),
    description: raw.description ?? null,
    receiptEmail: raw.receipt_email ?? null,
    created: isoFromUnix(raw.created) ?? new Date(0).toISOString(),
  }
}
