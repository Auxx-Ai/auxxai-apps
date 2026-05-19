// src/tools/shared/map-stripe-subscription.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { buildCustomerRef, type NestedCustomerRef } from './customer-ref'
import { isoFromUnix } from './iso'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused'

export interface MappedSubscriptionItem {
  itemId: string
  priceId: string
  productId: string
  quantity: number
}

export interface MappedStripeSubscription {
  subscriptionId: string
  status: SubscriptionStatus
  customer: NestedCustomerRef
  items: MappedSubscriptionItem[]
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  trialEnd: string | null
  livemode: boolean
}

function mapItem(item: any): MappedSubscriptionItem {
  const price = item.price ?? {}
  return {
    itemId: item.id,
    priceId: price.id ?? '',
    productId: typeof price.product === 'string' ? price.product : (price.product?.id ?? ''),
    quantity: Number(item.quantity ?? 1),
  }
}

export async function mapStripeSubscription(
  raw: any,
  ctx: ToolExecuteContext | undefined
): Promise<MappedStripeSubscription> {
  const customer = await buildCustomerRef(ctx, raw.customer)
  return {
    subscriptionId: raw.id,
    status: (raw.status as SubscriptionStatus) ?? 'incomplete',
    customer,
    items: (raw.items?.data ?? []).map(mapItem),
    currentPeriodStart: isoFromUnix(raw.current_period_start) ?? new Date(0).toISOString(),
    currentPeriodEnd: isoFromUnix(raw.current_period_end) ?? new Date(0).toISOString(),
    cancelAtPeriodEnd: Boolean(raw.cancel_at_period_end),
    canceledAt: isoFromUnix(raw.canceled_at),
    trialEnd: isoFromUnix(raw.trial_end),
    livemode: Boolean(raw.livemode),
  }
}
