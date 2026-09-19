// src/tools/shared/projections.ts

// Every projector returns `null` rather than throwing; the calling tool counts it as a
// `rejected` row so one bad transaction does not cost a page. Amounts pass through as
// exact decimal strings, and no output carries a fee — the acquirer bills monthly.

import {
  type AuthorizeNetBatch,
  type AuthorizeNetBatchStatistic,
  type AuthorizeNetTransactionDetail,
  type AuthorizeNetTransactionSummary,
  batchNetAmount,
} from './settlements'

/** The currency an Authorize.net merchant account settles in. Not stated per batch. */
export const DEFAULT_CURRENCY = 'USD'

/** `paging.offset` is a 1-based page number, not a row offset, so a cursor wraps that. */
export function encodeCursor(page: number): string {
  return `p${page}`
}

/** The page a cursor names, or 1 when it is absent or unreadable. */
export function decodeCursor(cursor: string | undefined | null): number {
  if (!cursor) return 1
  const page = Number(/^p(\d+)$/.exec(cursor.trim())?.[1])
  return Number.isInteger(page) && page >= 1 ? page : 1
}

/** Per-card-brand statistics on one batch. */
export interface ProjectedBatchBrand {
  accountType: string
  chargeAmount: string | null
  chargeCount: number
  refundAmount: string | null
  refundCount: number
  returnedItemAmount: string | null
  returnedItemCount: number
  chargebackAmount: string | null
  chargebackCount: number
  voidCount: number
  declineCount: number
  errorCount: number
}

/** One settled batch, as a payout header reads. */
export interface ProjectedBatch {
  batchId: string
  settledAt: string
  settledOn: string
  state: string
  paymentMethod: string | null
  /** A sum over brands of charge − refund − returned − chargeback; the only total there is. */
  netAmount: string
  currency: string
  perBrand: ProjectedBatchBrand[]
}

/** One transaction inside a batch. */
export interface ProjectedBatchTransaction {
  transId: string
  submittedAt: string
  status: string
  amount: string | null
  currency: string
  invoiceNumber: string | null
  accountType: string | null
  accountNumber: string | null
  hasReturnedItems: boolean | null
}

/** A captured-but-unsettled transaction. Same shape plus the channel fields. */
export interface ProjectedUnsettledTransaction extends ProjectedBatchTransaction {
  marketType: string | null
  product: string | null
}

/** One transaction's detail. No `billTo`, `shipTo` or `customer` is projected. */
export interface ProjectedTransactionDetail {
  transId: string
  type: string
  status: string
  submittedAt: string
  authAmount: string | null
  settleAmount: string | null
  currency: string
  authCode: string | null
  refTransId: string | null
  networkTransId: string | null
  batchId: string | null
  batchSettledAt: string | null
  batchState: string | null
  invoiceNumber: string | null
  description: string | null
  purchaseOrderNumber: string | null
  cardType: string | null
  cardNumber: string | null
}

/** A non-empty string, or null. Never coerces an object or an array into one. */
function text(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() === '' ? null : value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

/**
 * An amount as an exact decimal string. The reference is inconsistent — `"2.00"` on one
 * surface, the JSON number `12.22` on another — so a number is stringified, never rounded.
 */
function amount(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() === '' ? null : value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function count(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0
}

function flag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

/** Read a nested member without assuming the parent is an object. */
function child(parent: unknown, key: string): Record<string, unknown> | undefined {
  if (!parent || typeof parent !== 'object') return undefined
  const value = (parent as Record<string, unknown>)[key]
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

function projectBrand(raw: AuthorizeNetBatchStatistic): ProjectedBatchBrand {
  return {
    accountType: text(raw.accountType) ?? 'unknown',
    chargeAmount: amount(raw.chargeAmount),
    chargeCount: count(raw.chargeCount),
    refundAmount: amount(raw.refundAmount),
    refundCount: count(raw.refundCount),
    returnedItemAmount: amount(raw.returnedItemAmount),
    returnedItemCount: count(raw.returnedItemCount),
    chargebackAmount: amount(raw.chargebackAmount),
    chargebackCount: count(raw.chargebackCount),
    voidCount: count(raw.voidCount),
    declineCount: count(raw.declineCount),
    errorCount: count(raw.errorCount),
  }
}

/** Project one `getSettledBatchList` row; `netAmount` is the per-brand sum, not a stated total. */
export function projectBatch(
  raw: AuthorizeNetBatch,
  currency: string = DEFAULT_CURRENCY
): ProjectedBatch | null {
  const batchId = text(raw?.batchId)
  const settledAt = text(raw?.settlementTimeUTC)
  if (!batchId || !settledAt) return null

  const statistics = Array.isArray(raw.statistics) ? raw.statistics : undefined
  let netAmount: string
  try {
    netAmount = batchNetAmount(statistics)
  } catch {
    return null
  }

  return {
    batchId,
    settledAt,
    settledOn: settledAt.slice(0, 10),
    state: text(raw.settlementState) ?? 'unknown',
    paymentMethod: text(raw.paymentMethod),
    netAmount,
    currency,
    perBrand: (statistics ?? []).map(projectBrand),
  }
}

/** Project one `getTransactionList` row. `settleAmount` wins over `amount`. */
export function projectBatchTransaction(
  raw: AuthorizeNetTransactionSummary,
  currency: string = DEFAULT_CURRENCY
): ProjectedBatchTransaction | null {
  const transId = text(raw?.transId)
  const submittedAt = text(raw?.submitTimeUTC)
  if (!transId || !submittedAt) return null

  return {
    transId,
    submittedAt,
    status: text(raw.transactionStatus) ?? 'unknown',
    amount: amount(raw.settleAmount) ?? amount(raw.amount),
    currency,
    invoiceNumber: text(raw.invoiceNumber),
    accountType: text(raw.accountType),
    accountNumber: text(raw.accountNumber),
    hasReturnedItems: flag(raw.hasReturnedItems),
  }
}

/** Project one `getUnsettledTransactionList` row. */
export function projectUnsettledTransaction(
  raw: AuthorizeNetTransactionSummary,
  currency: string = DEFAULT_CURRENCY
): ProjectedUnsettledTransaction | null {
  const base = projectBatchTransaction(raw, currency)
  if (!base) return null
  return { ...base, marketType: text(raw.marketType), product: text(raw.product) }
}

/** Project one `getTransactionDetails` response. The customer blocks are dropped. */
export function projectTransactionDetail(
  raw: AuthorizeNetTransactionDetail,
  currency: string = DEFAULT_CURRENCY
): ProjectedTransactionDetail | null {
  const transId = text(raw?.transId)
  const submittedAt = text(raw?.submitTimeUTC)
  if (!transId || !submittedAt) return null

  const batch = child(raw, 'batch')
  const order = child(raw, 'order')
  const card = child(child(raw, 'payment'), 'creditCard')

  return {
    transId,
    type: text(raw.transactionType) ?? 'unknown',
    status: text(raw.transactionStatus) ?? 'unknown',
    submittedAt,
    authAmount: amount(raw.authAmount),
    settleAmount: amount(raw.settleAmount),
    currency,
    authCode: text(raw.authCode),
    refTransId: text(raw.refTransId),
    networkTransId: text(raw.networkTransId),
    batchId: text(batch?.batchId),
    batchSettledAt: text(batch?.settlementTimeUTC),
    batchState: text(batch?.settlementState),
    invoiceNumber: text(order?.invoiceNumber),
    description: text(order?.description),
    purchaseOrderNumber: text(order?.purchaseOrderNumber),
    cardType: text(card?.cardType),
    cardNumber: text(card?.cardNumber),
  }
}
