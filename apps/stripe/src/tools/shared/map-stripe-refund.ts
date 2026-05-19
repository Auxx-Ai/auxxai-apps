// src/tools/shared/map-stripe-refund.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { buildCustomerRef, type NestedCustomerRef, stripeCustomerIdOf } from './customer-ref'
import { isoFromUnix } from './iso'

export type RefundStatus = 'succeeded' | 'pending' | 'failed' | 'canceled'
export type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer'

export interface MappedStripeRefund {
  refundId: string
  chargeId: string
  amount: number
  currency: string
  status: RefundStatus
  reason: RefundReason | null
  customer: NestedCustomerRef
  created: string
}

export async function mapStripeRefund(
  raw: any,
  ctx: ToolExecuteContext | undefined,
  /**
   * Refunds embed a `charge` id; the customer comes from the parent charge.
   * Callers that already loaded the charge can pass it in to skip the
   * extra resolve; otherwise we leave customer null-ish.
   */
  customerHint?: unknown
): Promise<MappedStripeRefund> {
  const customer = await buildCustomerRef(ctx, customerHint ?? stripeCustomerIdOf(raw.customer))
  return {
    refundId: raw.id,
    chargeId: typeof raw.charge === 'string' ? raw.charge : (raw.charge?.id ?? ''),
    amount: Number(raw.amount ?? 0),
    currency: raw.currency ?? '',
    status: (raw.status as RefundStatus) ?? 'pending',
    reason: (raw.reason as RefundReason | null) ?? null,
    customer,
    created: isoFromUnix(raw.created) ?? new Date(0).toISOString(),
  }
}
