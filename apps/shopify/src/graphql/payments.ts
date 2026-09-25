// src/graphql/payments.ts

import type {
  PayoutStatus,
  RawBalanceTransaction,
  RawPayout,
} from '../blocks/shopify/shared/payments-api'
import type { GraphqlConnection } from './paged'

const MONEY = '{ amount }'
const BALANCE_NODE = `id type test transactionDate sourceId sourceType sourceOrderTransactionId
      amount { amount currencyCode } fee ${MONEY} net ${MONEY}
      associatedPayout { id status } associatedOrder { id }`

/** One payout header per call; `id` is the processor account identity (plan §7.2). */
export const PAYOUT_HEADERS_QUERY = `query PayoutHeader($after: String, $query: String) {
  shopifyPaymentsAccount {
    id
    payouts(first: 1, after: $after, query: $query) {
      pageInfo { hasNextPage endCursor }
      nodes {
        legacyResourceId status issuedAt net { amount currencyCode }
        summary {
          adjustmentsFee ${MONEY} adjustmentsGross ${MONEY}
          chargesFee ${MONEY} chargesGross ${MONEY}
          refundsFee ${MONEY} refundsFeeGross ${MONEY}
          reservedFundsFee ${MONEY} reservedFundsGross ${MONEY}
          retriedPayoutsFee ${MONEY} retriedPayoutsGross ${MONEY}
        }
      }
    }
  }
}`

/** A payout's members; `payments_transfer_id:` is the term that filters (plan §7.1). */
export const PAYOUT_MEMBERS_QUERY = `query PayoutMembers($after: String, $query: String!) {
  shopifyPaymentsAccount {
    id
    balanceTransactions(first: 250, after: $after, query: $query) {
      pageInfo { hasNextPage endCursor }
      nodes { ${BALANCE_NODE} }
    }
  }
}`

/** The balance history by processing date; `$query` carries the `processed_at` period. */
export const BALANCE_TRANSACTIONS_QUERY = `query BalanceTransactions($after: String, $query: String) {
  shopifyPaymentsAccount {
    id
    balanceTransactions(first: 250, after: $after, query: $query, sortKey: PROCESSED_AT) {
      pageInfo { hasNextPage endCursor }
      nodes { ${BALANCE_NODE} }
    }
  }
}`

/** The members query's search string for one payout id. */
export function payoutMembersQuery(payoutId: string): string {
  return `payments_transfer_id:${payoutId}`
}

type Money = { amount?: unknown; currencyCode?: unknown } | null

export interface GqlPayout {
  legacyResourceId: unknown
  status: string
  issuedAt: string | null
  net: Money
  summary?: Record<string, Money> | null
}

export interface GqlBalanceTransaction {
  id: unknown
  type: unknown
  test: boolean
  transactionDate: string | null
  sourceId?: unknown
  sourceType?: string | null
  sourceOrderTransactionId?: unknown
  amount: Money
  fee: Money
  net: Money
  associatedPayout?: { id?: unknown; status?: string | null } | null
  associatedOrder?: { id?: unknown } | null
}

export interface PaymentsAccountData<Key extends string, Node> {
  shopifyPaymentsAccount: ({ id?: string } & Record<Key, GraphqlConnection<Node>>) | null
}

const PAYOUT_STATUS: Record<string, PayoutStatus> = {
  SCHEDULED: 'scheduled',
  IN_TRANSIT: 'in_transit',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELED: 'canceled',
}

const TRANSFER_TYPES: Record<string, string> = {
  TRANSFER: 'payout',
  TRANSFER_FAILURE: 'payout_failure',
  TRANSFER_CANCEL: 'payout_cancellation',
}

/** Safe numeric ids become numbers as in REST; anything else passes through for evidenceId to judge. */
function restId(value: unknown): number {
  const exact = typeof value === 'string' && /^[1-9]\d*$/.test(value)
  return (exact && Number.isSafeInteger(Number(value)) ? Number(value) : value) as number
}

/** These payments types carry no legacyResourceId, so the id is the tail of a gid of `type`. */
function gidId(value: unknown, type: string): number | null {
  if (value == null) return null
  const match = typeof value === 'string' && value.match(/^gid:\/\/shopify\/(\w+)\/(\d+)$/)
  return match && match[1] === type ? restId(match[2]) : (value as number)
}

/** Adapt a GraphQL payout into the REST shape `payoutEvidence` validates. */
export function toRawPayout(node: GqlPayout): RawPayout {
  const status = PAYOUT_STATUS[node.status]
  if (!status) throw new Error(`Shopify Payments returned an unknown payout status: ${node.status}`)
  const issued = typeof node.issuedAt === 'string' ? new Date(node.issuedAt) : null
  if (!issued || !Number.isFinite(issued.getTime()))
    throw new Error('Shopify Payments returned an invalid payout issue date')
  const s = node.summary ?? {}
  const amount = (key: string) => s[key]?.amount as string
  return {
    id: restId(node.legacyResourceId),
    status,
    // REST `date` is the UTC date of issuedAt, not shop-local (plan §7.3).
    date: issued.toISOString().slice(0, 10),
    currency: node.net?.currencyCode as string,
    amount: node.net?.amount as string,
    summary: {
      adjustments_fee_amount: amount('adjustmentsFee'),
      adjustments_gross_amount: amount('adjustmentsGross'),
      charges_fee_amount: amount('chargesFee'),
      charges_gross_amount: amount('chargesGross'),
      refunds_fee_amount: amount('refundsFee'),
      refunds_gross_amount: amount('refundsFeeGross'),
      reserved_funds_fee_amount: amount('reservedFundsFee'),
      reserved_funds_gross_amount: amount('reservedFundsGross'),
      retried_payouts_fee_amount: amount('retriedPayoutsFee'),
      retried_payouts_gross_amount: amount('retriedPayoutsGross'),
    },
  }
}

/** Unknown types pass lowercased on purpose: `balanceActivity` files them as `unknown` (§7.3). */
export function balanceType(type: unknown): string {
  if (typeof type !== 'string') return type as string
  return TRANSFER_TYPES[type] ?? type.toLowerCase()
}

/** Adapt a GraphQL balance transaction into the REST shape `balanceEvidence` validates. */
export function toRawBalanceTransaction(node: GqlBalanceTransaction): RawBalanceTransaction {
  const payout = node.associatedPayout
  const sourceType = node.sourceType
  return {
    id: gidId(node.id, 'ShopifyPaymentsBalanceTransaction') as number,
    type: balanceType(node.type),
    test: node.test,
    payout_id: gidId(payout?.id, 'ShopifyPaymentsPayout'),
    payout_status: (typeof payout?.status === 'string'
      ? payout.status.toLowerCase()
      : null) as string,
    currency: node.amount?.currencyCode as string,
    amount: node.amount?.amount as string,
    fee: node.fee?.amount as string,
    net: node.net?.amount as string,
    source_id: node.sourceId == null ? null : restId(node.sourceId),
    source_type: typeof sourceType === 'string' ? balanceType(sourceType) : null,
    source_order_id: gidId(node.associatedOrder?.id, 'Order'),
    source_order_transaction_id:
      node.sourceOrderTransactionId == null ? null : restId(node.sourceOrderTransactionId),
    processed_at: node.transactionDate as string,
  }
}
