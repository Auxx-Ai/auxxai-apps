// src/tools/shared/customer-ref.ts

/**
 * Helper to build a `customer: { stripeCustomerId, auxxRecordId, notImportedReason? }`
 * payload from a raw Stripe object's `customer` field (which Stripe returns
 * as a string id or, when expanded, an object with `.id`).
 *
 * Used by every mapper for objects that nest a customer ref
 * (charge / refund / payment-intent / subscription / invoice).
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { resolveContactRef } from './resolve-contact-ref'

export interface NestedCustomerRef {
  stripeCustomerId: string | null
  auxxRecordId: string | null
  notImportedReason?: 'NOT_IMPORTED'
}

export function stripeCustomerIdOf(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  if (
    typeof raw === 'object' &&
    raw &&
    'id' in raw &&
    typeof (raw as { id: unknown }).id === 'string'
  ) {
    return (raw as { id: string }).id
  }
  return null
}

export async function buildCustomerRef(
  ctx: ToolExecuteContext | undefined,
  rawCustomer: unknown
): Promise<NestedCustomerRef> {
  const stripeCustomerId = stripeCustomerIdOf(rawCustomer)
  if (!stripeCustomerId) {
    return { stripeCustomerId: null, auxxRecordId: null }
  }
  const auxxRecordId = await resolveContactRef(ctx, stripeCustomerId)
  return {
    stripeCustomerId,
    auxxRecordId,
    notImportedReason: auxxRecordId ? undefined : 'NOT_IMPORTED',
  }
}
