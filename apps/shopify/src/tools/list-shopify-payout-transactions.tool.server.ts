// src/tools/list-shopify-payout-transactions.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import {
  listAllPayoutTransactions,
  type PayoutTransactionRecord,
} from '../blocks/shopify/shared/payments-api'
import { getShopifyConnection } from './shared/connection'
import { assertPaymentsReadCapability } from './shared/payments-capability'

interface ListShopifyPayoutTransactionsInput {
  payoutId: string
}

interface ListShopifyPayoutTransactionsOutput {
  transactions: PayoutTransactionRecord[]
}

/**
 * Every balance transaction inside one payout, paged to exhaustion. The split the platform
 * builds from these must sum to the payout, so a page failure is a refusal, never a
 * shorter list (brief 27 §4).
 */
export default async function listShopifyPayoutTransactions(
  input: ListShopifyPayoutTransactionsInput,
): Promise<ListShopifyPayoutTransactionsOutput> {
  const payoutId = String(input.payoutId ?? '').trim()
  if (!/^\d+$/.test(payoutId)) {
    throw new InvalidInputError(
      `payoutId must be a numeric Shopify payout id, got "${input.payoutId}"`,
    )
  }

  assertPaymentsReadCapability()
  const { token, shopDomain } = getShopifyConnection()

  const transactions = await listAllPayoutTransactions(shopDomain, token, payoutId)
  return { transactions }
}
