// src/tools/list-shopify-payouts.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import {
  listAllPayouts,
  PAYOUT_STATUSES,
  type PayoutRecord,
  type PayoutStatus,
} from '../blocks/shopify/shared/payments-api'
import { getShopifyConnection } from './shared/connection'
import { assertPaymentsReadCapability } from './shared/payments-capability'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

interface ListShopifyPayoutsInput {
  since: string
  until?: string
  status?: PayoutStatus
}

interface ListShopifyPayoutsOutput {
  payouts: PayoutRecord[]
}

/**
 * Every Shopify Payments payout dated on or after `since` (and on or before `until`),
 * oldest first, paged to exhaustion. A page failure is a refusal, never a shorter list.
 */
export default async function listShopifyPayouts(
  input: ListShopifyPayoutsInput,
): Promise<ListShopifyPayoutsOutput> {
  if (!DATE_RE.test(input.since)) {
    throw new InvalidInputError(`since must be YYYY-MM-DD, got "${input.since}"`)
  }
  if (input.until !== undefined && !DATE_RE.test(input.until)) {
    throw new InvalidInputError(`until must be YYYY-MM-DD, got "${input.until}"`)
  }
  if (input.until !== undefined && input.since > input.until) {
    throw new InvalidInputError(`since "${input.since}" is after until "${input.until}"`)
  }
  if (input.status !== undefined && !PAYOUT_STATUSES.includes(input.status)) {
    throw new InvalidInputError(`status must be one of ${PAYOUT_STATUSES.join(', ')}`)
  }

  assertPaymentsReadCapability()
  const { token, shopDomain } = getShopifyConnection()

  const payouts = await listAllPayouts(shopDomain, token, {
    dateMin: input.since,
    dateMax: input.until,
    status: input.status,
  })
  return { payouts }
}
