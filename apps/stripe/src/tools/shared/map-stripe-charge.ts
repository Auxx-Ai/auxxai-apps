// src/tools/shared/map-stripe-charge.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { buildCustomerRef, type NestedCustomerRef } from './customer-ref'
import { isoFromUnix } from './iso'

export interface MappedStripeCharge {
  chargeId: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed'
  paid: boolean
  refunded: boolean
  amountRefunded: number
  customer: NestedCustomerRef
  description: string | null
  receiptUrl: string | null
  created: string
  livemode: boolean
}

export async function mapStripeCharge(
  raw: any,
  ctx: ToolExecuteContext | undefined
): Promise<MappedStripeCharge> {
  const customer = await buildCustomerRef(ctx, raw.customer)
  return {
    chargeId: raw.id,
    amount: Number(raw.amount ?? 0),
    currency: raw.currency ?? '',
    status: (raw.status as 'succeeded' | 'pending' | 'failed') ?? 'pending',
    paid: Boolean(raw.paid),
    refunded: Boolean(raw.refunded),
    amountRefunded: Number(raw.amount_refunded ?? 0),
    customer,
    description: raw.description ?? null,
    receiptUrl: raw.receipt_url ?? null,
    created: isoFromUnix(raw.created) ?? new Date(0).toISOString(),
    livemode: Boolean(raw.livemode),
  }
}
