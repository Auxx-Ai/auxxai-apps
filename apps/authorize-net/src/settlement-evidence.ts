// src/settlement-evidence.ts

// The only file allowed to know Authorize.net's JSON. `fee` is always "0" and
// `net === gross` because the acquirer bills card fees monthly (build plan §4.1).
// No live probe has run; the unproven rules are listed in `ASSUMPTIONS.md`.

/** The seven activity meanings `processorActivityKindSchema` accepts. Closed set. */
export type ProcessorActivityKind =
  'charge' | 'refund' | 'fee' | 'adjustment' | 'outgoing_transfer' | 'returned_transfer' | 'unknown'

/** Last-resort currency: neither a batch nor a transaction states one. */
export const AUTHORIZE_NET_DEFAULT_CURRENCY = 'USD'

/** Statistics for one card brand (or `eCheck`) within a settled batch. */
export interface AuthorizeNetBatchStatistic {
  accountType: string
  chargeAmount: string
  chargeCount: number
  refundAmount: string
  refundCount: number
  voidCount: number
  declineCount: number
  errorCount: number
  returnedItemAmount?: string
  returnedItemCount?: number
  chargebackAmount?: string
  chargebackCount?: number
  [key: string]: unknown
}

/** One row of `getSettledBatchListRequest` — the payout header. */
export interface AuthorizeNetBatch {
  batchId: string
  settlementTimeUTC: string
  settlementTimeLocal?: string
  settlementState: string
  paymentMethod?: string
  marketType?: string
  product?: string
  statistics?: AuthorizeNetBatchStatistic[]
  [key: string]: unknown
}

/** One row of `getTransactionListRequest` — a payout member. */
export interface AuthorizeNetTransactionSummary {
  transId: string
  submitTimeUTC: string
  submitTimeLocal?: string
  transactionStatus: string
  invoiceNumber?: string
  firstName?: string
  lastName?: string
  accountType?: string
  accountNumber?: string
  settleAmount?: string | number
  amount?: string | number
  marketType?: string
  product?: string
  hasReturnedItems?: boolean
  [key: string]: unknown
}

/** `getTransactionDetailsRequest` — the only surface that names `transactionType`. */
export interface AuthorizeNetTransactionDetail {
  transId: string
  transactionType: string
  transactionStatus: string
  submitTimeUTC: string
  authAmount?: string | number
  settleAmount?: string | number
  refTransId?: string
  authCode?: string
  networkTransId?: string
  batch?: { batchId: string; settlementTimeUTC: string; settlementState: string }
  order?: { invoiceNumber?: string; description?: string; purchaseOrderNumber?: string }
  payment?: Record<string, unknown>
  [key: string]: unknown
}

/** Per-call overrides for what Authorize.net does not state on the row. */
export interface AuthorizeNetEvidenceOptions {
  /** From `getMerchantDetails().currencies[0]`; falls back to USD. */
  currency?: string
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const OFFSET_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const NAKED_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/
const DECIMAL = /^-?(0|[1-9]\d*)(\.\d+)?$/
// Every Auxx app compiles at `target: ES2019`, which has no BigInt literals.
const ZERO = BigInt(0)
const TEN = BigInt(10)

/** Statuses whose money has actually settled into the batch. */
const SETTLED_STATUSES = new Set(['settledSuccessfully', 'refundSettledSuccessfully'])

/** Statuses that carry no settled money at all — they are counted, not banked. */
const OMITTED_STATUSES = new Set([
  'voided',
  'declined',
  'expired',
  'generalError',
  'communicationError',
  'settlementError',
  'couldNotVoid',
  'authorizedPendingCapture',
  'capturedPendingSettlement',
  'refundPendingSettlement',
  'FDSPendingReview',
  'FDSAuthorizedPendingReview',
  'underReview',
  'approvedReview',
  'declinedReview',
  'failedReview',
])

/** A chargeback or a returned eCheck item is an adjustment, never a `returned_transfer`. */
const ADJUSTMENT_STATUSES = new Set(['returnedItem', 'chargeback', 'chargebackReversal'])

/** Money leaves the merchant on these, so their amount is signed negative. */
const OUTGOING_STATUSES = new Set(['returnedItem', 'chargeback'])

const OMITTED_TYPES = new Set(['voidTransaction', 'authOnlyTransaction'])
const CHARGE_TYPES = new Set([
  'authCaptureTransaction',
  'captureOnlyTransaction',
  'priorAuthCaptureTransaction',
])

/** ISO currency precision, derived the same way `exactEvidenceMinor` does. */
export function evidenceCurrencyExponent(currency: string): number {
  const currencyIntl = Intl as typeof Intl & { supportedValuesOf(key: 'currency'): string[] }
  if (!currencyIntl.supportedValuesOf('currency').includes(currency)) {
    throw new Error(`Authorize.net returned an unsupported currency: ${currency}`)
  }
  return (
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  )
}

/**
 * Normalise one money field to a bigint count of minor units; numbers are stringified
 * first, so no value passes through a float multiply.
 */
export function authorizeNetMinor(value: unknown, exponent: number): bigint {
  const text =
    typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : ''
  if (text === '') {
    throw new Error('Authorize.net returned a missing or non-numeric settlement amount')
  }
  if (!DECIMAL.test(text)) {
    throw new Error(`Authorize.net returned an invalid decimal amount: ${text}`)
  }
  const negative = text.startsWith('-')
  const [whole = '0', fraction = ''] = (negative ? text.slice(1) : text).split('.')
  if (fraction.length > exponent && /[1-9]/.test(fraction.slice(exponent))) {
    throw new Error(`Authorize.net returned an amount finer than ${exponent} decimals: ${text}`)
  }
  const absolute =
    BigInt(whole) * TEN ** BigInt(exponent) +
    BigInt(fraction.slice(0, exponent).padEnd(exponent, '0') || '0')
  return negative ? -absolute : absolute
}

/** An absent optional amount is zero, not a failure. */
function optionalMinor(value: unknown, exponent: number): bigint {
  return value === undefined || value === null || value === ''
    ? ZERO
    : authorizeNetMinor(value, exponent)
}

/** Format a minor-unit count as the exact decimal string the contract wants. */
export function evidenceAmount(minor: bigint, exponent: number): string {
  if (exponent === 0) return minor.toString()
  const negative = minor < ZERO
  const digits = (negative ? -minor : minor).toString().padStart(exponent + 1, '0')
  const whole = digits.slice(0, digits.length - exponent)
  const fraction = digits.slice(digits.length - exponent)
  return `${negative ? '-' : ''}${whole}.${fraction}`
}

/** An Authorize.net identifier, verbatim — nothing trims, cases or parses one. */
export function authorizeNetId(value: unknown): string {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value)
  throw new Error('Authorize.net returned a missing or unsafe identifier')
}

const nullableId = (value: unknown): string | null =>
  value === undefined || value === null || value === '' ? null : authorizeNetId(value)

/** First alias present with a real value. */
function pick(raw: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = raw[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

/**
 * A full offset-bearing timestamp. The reference's `...UTC` examples omit the `Z`, which
 * `datetime({ offset: true })` refuses, so a naked value is stamped UTC rather than dropped.
 */
function evidenceTimestamp(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'string') {
    if (OFFSET_DATE_TIME.test(value) && Number.isFinite(Date.parse(value))) return value
    if (NAKED_DATE_TIME.test(value) && Number.isFinite(Date.parse(`${value}Z`))) return `${value}Z`
  }
  throw new Error('Authorize.net returned an invalid settlement timestamp')
}

/** The calendar date of a settlement, which the contract requires date-only. */
function evidenceDate(value: unknown): string {
  const timestamp = evidenceTimestamp(value)
  const date = timestamp === null ? '' : timestamp.slice(0, 10)
  if (DATE_ONLY.test(date) && new Date(date).toISOString().slice(0, 10) === date) return date
  throw new Error('Authorize.net returned an invalid settlement date')
}

/** Row currency, then the caller's, then the region default. */
function readCurrency(fallback: string | undefined): string {
  if (fallback === undefined || fallback === '') return AUTHORIZE_NET_DEFAULT_CURRENCY
  if (!/^[A-Za-z]{3}$/.test(fallback)) {
    throw new Error('Authorize.net returned an invalid settlement currency')
  }
  return fallback.toUpperCase()
}

/**
 * The batch's settled total, in minor units: a sum of the per-brand statistics, because
 * the header states no total of its own (build plan §3.4 item 1). `chargebackAmount` is
 * deliberately not subtracted, so a chargeback that is also a member row stays visible
 * to the platform's assessment.
 */
function batchNetMinor(
  statistics: AuthorizeNetBatchStatistic[] | undefined,
  exponent: number
): bigint {
  let total = ZERO
  for (const stat of statistics ?? []) {
    total += optionalMinor(stat.chargeAmount, exponent)
    total -= optionalMinor(stat.refundAmount, exponent)
    if (String(stat.accountType ?? '').toLowerCase() === 'echeck') {
      total -= optionalMinor(stat.returnedItemAmount, exponent)
    }
  }
  return total
}

/** {@link batchNetMinor} as the exact decimal string the contract wants. */
export function batchNetAmount(
  statistics: AuthorizeNetBatchStatistic[] | undefined,
  exponent = 2
): string {
  return evidenceAmount(batchNetMinor(statistics, exponent), exponent)
}

/**
 * The activity kind for one settled transaction, or `null` when the row carries no
 * settled money and must be omitted from membership (a void, an authorization, a
 * decline). `transactionType` is absent from the list surface, so the status alone
 * answers when it is undefined (build plan §4.3).
 */
export function authorizeNetActivityKind(
  transactionType: string | undefined,
  transactionStatus: string
): ProcessorActivityKind | null {
  if (ADJUSTMENT_STATUSES.has(transactionStatus)) return 'adjustment'
  if (OMITTED_STATUSES.has(transactionStatus)) return null
  if (transactionType !== undefined && OMITTED_TYPES.has(transactionType)) return null
  if (!SETTLED_STATUSES.has(transactionStatus)) return 'unknown'
  if (transactionType === undefined || transactionType === '') {
    return transactionStatus === 'refundSettledSuccessfully' ? 'refund' : 'charge'
  }
  if (CHARGE_TYPES.has(transactionType)) return 'charge'
  if (transactionType === 'refundTransaction') return 'refund'
  return 'unknown'
}

/** The payout header shape `payoutEvidenceEnvelopeSchema` accepts. */
export interface AuthorizeNetPayoutEvidence {
  id: string
  status: string
  amount: string
  currency: string
  currencyExponent: number
  issuedAt: string | null
  issuedOn: string
  /** Always null: a batch names no bank account — build plan §3.4 item 3. */
  destinationExternalId: null
  raw: AuthorizeNetBatch
}

/**
 * One settled batch as a payout header. `status` is `settlementState` verbatim,
 * `settlementError` included, so the platform's assessment refuses the batch rather
 * than it disappearing from the feed.
 */
export function payoutEvidence(
  raw: AuthorizeNetBatch,
  options: AuthorizeNetEvidenceOptions = {}
): AuthorizeNetPayoutEvidence {
  const currency = readCurrency(options.currency)
  const currencyExponent = evidenceCurrencyExponent(currency)
  const state = raw.settlementState
  if (typeof state !== 'string' || state.trim() === '') {
    throw new Error('Authorize.net returned a batch with no settlement state')
  }

  return {
    id: authorizeNetId(raw.batchId),
    status: state,
    amount: evidenceAmount(batchNetMinor(raw.statistics, currencyExponent), currencyExponent),
    currency,
    currencyExponent,
    issuedAt: evidenceTimestamp(raw.settlementTimeUTC),
    issuedOn: evidenceDate(raw.settlementTimeUTC),
    destinationExternalId: null,
    raw,
  }
}

/** The processor entry shape, plus `providerType`. */
export interface AuthorizeNetProcessorEvidence {
  id: string
  type: ProcessorActivityKind
  providerType: string
  gross: string
  /** Always `"0"`: a billed rail nets nothing on the wire — build plan §4.1. */
  fee: string
  net: string
  currency: string
  currencyExponent: number
  transactionDate: string | null
  payoutId: string | null
  sourceTransactionId: string | null
  sourceOrderId: string | null
  sourceId: string | null
  sourceType: string | null
  raw: AuthorizeNetTransactionSummary | AuthorizeNetTransactionDetail
}

/**
 * One transaction of a settled batch as exact processor activity, or `null` when it
 * carries no settled money and belongs in the batch counts only.
 */
export function processorEvidence(
  raw: AuthorizeNetTransactionSummary | AuthorizeNetTransactionDetail,
  batch: Pick<AuthorizeNetBatch, 'batchId'>,
  options: AuthorizeNetEvidenceOptions = {}
): AuthorizeNetProcessorEvidence | null {
  const status = raw.transactionStatus
  if (typeof status !== 'string' || status === '') {
    throw new Error('Authorize.net returned a transaction with no status')
  }
  const fields = raw as Record<string, unknown>
  const transactionType =
    typeof fields.transactionType === 'string' && fields.transactionType !== ''
      ? fields.transactionType
      : undefined
  const kind = authorizeNetActivityKind(transactionType, status)
  if (kind === null) return null

  const currency = readCurrency(options.currency)
  const currencyExponent = evidenceCurrencyExponent(currency)
  const magnitude = authorizeNetMinor(
    pick(fields, 'settleAmount', 'amount', 'authAmount'),
    currencyExponent
  )
  // Unproven whether the gateway signs a refund; money leaving the merchant is forced
  // negative so member net sums to the header, which subtracts the same figures.
  const outgoing = kind === 'refund' || OUTGOING_STATUSES.has(status)
  const grossMinor = outgoing && magnitude > ZERO ? -magnitude : magnitude
  const gross = evidenceAmount(grossMinor, currencyExponent)
  const order = fields.order as { invoiceNumber?: string } | undefined

  return {
    id: authorizeNetId(raw.transId),
    type: kind,
    // The list surface reports no type at all, so the status stands in for it.
    providerType: transactionType ?? status,
    gross,
    // Zero because the acquirer bills card fees monthly; nothing is netted on the wire.
    fee: evidenceAmount(ZERO, currencyExponent),
    net: gross,
    currency,
    currencyExponent,
    transactionDate: evidenceTimestamp(raw.submitTimeUTC),
    payoutId: authorizeNetId(batch.batchId),
    sourceTransactionId: authorizeNetId(raw.transId),
    // Verbatim, never parsed: the order name Shopify puts in the invoice field.
    sourceOrderId: nullableId(pick(fields, 'invoiceNumber', 'invoice') ?? order?.invoiceNumber),
    // The refunded/captured original, when the detail surface names one.
    sourceId: nullableId(fields.refTransId),
    // The brand split the bank matcher needs when an acquirer funds American Express
    // separately (build plan §3.4 item 2).
    sourceType: nullableId(fields.accountType),
    raw,
  }
}
