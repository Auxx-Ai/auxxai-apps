// src/settlement-evidence.ts

/**
 * Affirm settlement JSON in, platform money contract out.
 *
 * This is the ONLY file in the app allowed to know what Affirm's JSON looks
 * like. Everything downstream — connector, tools, blocks — sees the shapes in
 * `packages/lib/src/money/payouts/evidence-contracts.ts` and nothing else. It
 * is the exact counterpart of the Shopify app's
 * `src/blocks/shopify/shared/payments-evidence.ts`.
 *
 * ## The arithmetic (build plan §4.1, confirmed against real deposits)
 *
 * Affirm signs its fees NEGATIVE. From the live public API, 2026-09-16, the
 * same deposit the CSV export also describes:
 *
 * ```
 * sales 374005   refunds 0   fees -16075   transaction_fees -30   total_settled 357930
 * ```
 *
 * ⚠️ **`fees` is the WHOLE fee; `transaction_fees` is a component OF it, not an
 * addition to it.** `374005 + (-16075) = 357930` exactly, and the same identity
 * held on all six deposits probed, with `transaction_fees` outside it entirely.
 * The CSV export splits the same money across two columns (`-160.45` + `-0.30`)
 * that sum to the API's single `fees`, which is what misled the first pass.
 *
 * The platform wants `fee` POSITIVE and rejects any entry where
 * `gross - fee !== net`. So:
 *
 * ```
 * fee   = -fees                        // 16075, positive
 * net   = total_settled                // 357930
 * gross = net + fee                    // 374005 — DERIVED, not transcribed
 * ```
 *
 * `gross` is derived rather than transcribed from `sales + refunds` on purpose.
 * The identity then holds by construction, so a cent of disagreement inside
 * Affirm keeps the row (and stays visible in `raw`) instead of losing it to
 * `assessPayoutMembership`. On observed data the two agree exactly, and
 * `tests/settlement-evidence.test.ts` asserts that — so the TEST, not the
 * mapping, is what fails if Affirm changes.
 *
 * ## Units — observed, and still a single switch
 *
 * Affirm reports the SAME money two ways: the portal's JSON returned integer
 * cents (`374005`) while its CSV export returned decimal dollars (`3740.05`).
 * The PUBLIC API was probed on 2026-09-16 and returns **integer minor units**
 * on both `/settlements/daily` and `/settlements/events`, so
 * {@link AFFIRM_SETTLEMENT_MONEY_UNITS} defaults to `'minor'` on evidence
 * rather than on reasoning.
 *
 * The convention stays one named constant, and flipping it is the whole change,
 * because the CSV surface still disagrees and a caller reading one can pass
 * `units` per call.
 *
 * Every amount is normalised to a bigint count of minor units at the
 * boundary, all arithmetic happens in bigint, and the exact decimal string the
 * contract wants is formatted once at the end with string arithmetic. There is
 * no `value / 100` anywhere in this file, and there must never be: that is
 * binary floating point on money, and `exactEvidenceMinor` exists to avoid it.
 */

/** The seven activity meanings `processorActivityKindSchema` accepts. Closed set. */
export type ProcessorActivityKind =
  | 'charge'
  | 'refund'
  | 'fee'
  | 'adjustment'
  | 'outgoing_transfer'
  | 'returned_transfer'
  | 'unknown'

/** How a money field is expressed on the wire. */
export type AffirmMoneyUnits = 'minor' | 'decimal'

/**
 * How the PUBLIC settlement API reports money.
 *
 * ✔ Observed 2026-09-16: `/settlements/daily` and `/settlements/events` both
 * return integer minor units (`357930`, `-16075`). The CSV export does not, so
 * both settings stay exercised by the test suite and a caller reading another
 * surface can override per call with {@link AffirmEvidenceOptions.units}.
 */
export const AFFIRM_SETTLEMENT_MONEY_UNITS: AffirmMoneyUnits = 'minor'

/**
 * Last-resort currency for a row that does not carry one.
 *
 * ⚠️ A FALLBACK THAT LIVE DATA DID NOT NEED. The portal's settlement JSON
 * carried no `currency` on its events, which is why this exists — but the
 * public API probe of 2026-09-16 found `currency` present on **9/9**
 * `/settlements/events` rows and on **every** `/settlements/daily` row. So
 * {@link readCurrency} prefers the row's own value, then the caller's (the
 * connector passes the daily summary's), and only then this constant.
 *
 * It stays because the contract requires a currency on EVERY entry and this app
 * is United-States-region only, so USD is the honest answer for a row that
 * somehow arrives without one. Reaching it is now an anomaly, not the norm.
 */
export const AFFIRM_DEFAULT_CURRENCY = 'USD'

/**
 * Payout status when Affirm reports no `removal_state`.
 *
 * Affirm has no positive status field: a settlement row exists because the
 * money moved, and `removal_state` only appears when it did not. The contract
 * requires a non-empty status, so a present deposit is `paid`.
 */
const AFFIRM_SETTLED_STATUS = 'paid'

/**
 * A `/settlements/daily` row. Field names are read through aliases because
 * three disagreeing vocabularies exist for the same numbers: the API reference
 * (`total_sales`, `total_fees`), the portal JSON (`sales`, `fees`) and the CSV
 * export (`txn_fees`, `mdr_rate`). ✔ The public API speaks the FIRST on this
 * endpoint (`total_settled`, `total_sales`, `total_fees`, `total_refunds`) and
 * the second on `/settlements/events` — which is exactly why all of them are
 * accepted rather than one being picked.
 */
export interface AffirmSettlementSummary {
  deposit_id?: unknown
  date?: unknown
  total_settled?: unknown
  total_sales?: unknown
  sales?: unknown
  total_refunds?: unknown
  refunds?: unknown
  total_fees?: unknown
  fees?: unknown
  currency?: unknown
  account_last_four?: unknown
  removal_state?: unknown
  [key: string]: unknown
}

/** A `/settlements/events` row. Same alias tolerance as the summary. */
export interface AffirmSettlementEvent {
  id?: unknown
  deposit_id?: unknown
  date?: unknown
  effective_date?: unknown
  order_id?: unknown
  transaction_id?: unknown
  purchase_id?: unknown
  transaction_event_id?: unknown
  event_type?: unknown
  sales?: unknown
  refunds?: unknown
  fees?: unknown
  transaction_fees?: unknown
  txn_fees?: unknown
  total_settled?: unknown
  currency?: unknown
  /** Merchant discount rate. Stays in `raw` only — it is never a mapped field. */
  mdr?: unknown
  [key: string]: unknown
}

/** Per-call overrides for the two things Affirm does not always state. */
export interface AffirmEvidenceOptions {
  /** Currency to use when the row does not carry one. */
  currency?: string
  /** Wire units, for the one live call that proves them. */
  units?: AffirmMoneyUnits
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
// Every Auxx app compiles at `target: ES2019`, which has no BigInt LITERALS
// (`0n`, `10n`) — only the `BigInt()` constructor. The arithmetic below is
// bigint throughout regardless; this is a syntax constraint, not a semantic one.
const ZERO = BigInt(0)
const TEN = BigInt(10)

const INTEGER = /^-?\d+$/
const DECIMAL = /^-?(0|[1-9]\d*)(\.\d+)?$/

/**
 * ISO currency precision, matching the platform money contract.
 *
 * `exactEvidenceMinor` re-derives this from `minorUnitExponent` and throws when
 * the two disagree, so it has to be computed the same way, not assumed to be 2.
 */
export function evidenceCurrencyExponent(currency: string): number {
  const currencyIntl = Intl as typeof Intl & { supportedValuesOf(key: 'currency'): string[] }
  if (!currencyIntl.supportedValuesOf('currency').includes(currency)) {
    throw new Error(`Affirm returned an unsupported currency: ${currency}`)
  }
  return (
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  )
}

/**
 * Normalise one Affirm money field to a bigint count of minor units.
 *
 * Numbers are stringified first (`String(3579.3)` is `'3579.3'`, JavaScript's
 * shortest round-trip form) and exponent notation is refused outright rather
 * than parsed, so no value ever passes through a float multiplication.
 */
export function affirmMinor(
  value: unknown,
  exponent: number,
  units: AffirmMoneyUnits = AFFIRM_SETTLEMENT_MONEY_UNITS
): bigint {
  const text =
    typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : ''
  if (text === '') throw new Error('Affirm returned a missing or non-numeric settlement amount')

  if (units === 'minor') {
    if (!INTEGER.test(text)) {
      throw new Error(`Affirm returned a non-integer minor-unit amount: ${text}`)
    }
    return BigInt(text)
  }

  if (!DECIMAL.test(text)) throw new Error(`Affirm returned an invalid decimal amount: ${text}`)
  const negative = text.startsWith('-')
  const [whole = '0', fraction = ''] = (negative ? text.slice(1) : text).split('.')
  if (fraction.length > exponent && /[1-9]/.test(fraction.slice(exponent))) {
    throw new Error(`Affirm returned an amount finer than ${exponent} decimal places: ${text}`)
  }
  const absolute =
    BigInt(whole) * TEN ** BigInt(exponent) +
    BigInt(fraction.slice(0, exponent).padEnd(exponent, '0') || '0')
  return negative ? -absolute : absolute
}

/** An absent optional amount is zero, not a failure. Affirm omits fees on many rows. */
function optionalMinor(value: unknown, exponent: number, units: AffirmMoneyUnits): bigint {
  return value === undefined || value === null || value === ''
    ? ZERO
    : affirmMinor(value, exponent, units)
}

/**
 * Format a minor-unit count as the exact decimal string the contract wants.
 * String arithmetic only — this is the inverse of `exactEvidenceMinor`.
 */
export function evidenceAmount(minor: bigint, exponent: number): string {
  if (exponent === 0) return minor.toString()
  const negative = minor < ZERO
  const digits = (negative ? -minor : minor).toString().padStart(exponent + 1, '0')
  const whole = digits.slice(0, digits.length - exponent)
  const fraction = digits.slice(digits.length - exponent)
  return `${negative ? '-' : ''}${whole}.${fraction}`
}

/** First alias present with a real value, so three vocabularies can share one mapping. */
function pick(raw: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = raw[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

/**
 * An Affirm identifier, VERBATIM. Affirm's ids are opaque alphanumerics
 * (`I5Y8PHAWWSSS2WJ`, `CPDZ-ANRU`, `rPhjzMna9vESRYlOF0hLADbBL`); nothing here
 * trims, cases or parses them.
 */
export function affirmId(value: unknown): string {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value)
  throw new Error('Affirm returned a missing or unsafe identifier')
}

const nullableId = (value: unknown): string | null =>
  value === undefined || value === null || value === '' ? null : affirmId(value)

/** A calendar date for `issuedOn`, which the contract requires date-only. */
function evidenceDate(value: unknown): string {
  if (typeof value === 'string') {
    const timestamp = DATE_TIME.exec(value)
    const date = timestamp ? timestamp[1]! : value
    if (DATE_ONLY.test(date) && new Date(date).toISOString().slice(0, 10) === date) return date
  }
  throw new Error('Affirm returned an invalid settlement date')
}

/**
 * A timestamp for `transactionDate`, which the contract requires to be a full
 * offset-bearing datetime.
 *
 * Affirm carries BOTH: `effective_date` is a real offset-bearing timestamp
 * (`2026-09-14T19:28:14Z`) and `date` is date-only (`2026-09-15`). The caller
 * prefers `effective_date`; a date-only value is promoted to UTC midnight so
 * the contract is satisfiable at all when it is absent, and the untouched
 * originals both stay in `raw`.
 */
function evidenceTimestamp(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'string') {
    if (DATE_TIME.test(value) && Number.isFinite(Date.parse(value))) return value
    if (DATE_ONLY.test(value) && new Date(value).toISOString().slice(0, 10) === value) {
      return `${value}T00:00:00Z`
    }
  }
  throw new Error('Affirm returned an invalid settlement event date')
}

/**
 * Translate an Affirm `event_type` into one of the platform's seven activity
 * kinds, without making an unrecognised movement eligible for settlement.
 *
 * ⚠️ Affirm uses BOTH spellings, on two different surfaces. The merchant
 * portal's settlement report says `loan_captured` (probe §3); the PUBLIC API,
 * probed 2026-09-16, says `loan_capture` on all nine events — the spelling its
 * own API reference documents. Neither surface can be assumed for the other.
 * Both spellings are accepted for every value, and the `default` case is load
 * bearing: `unknown` makes `assessPayoutMembership` mark the payout
 * `unsupported` with *"requires separate activity assessment"*, which is the
 * correct visible outcome for an event type Affirm adds after we ship.
 *
 * Disputes map to `adjustment`. `processorActivityKindSchema` is a closed set
 * with no dispute kind, and mapping them here loses a label, not money —
 * widening a shared platform enum is a separate brief (build plan §4.3).
 */
export function affirmActivityKind(eventType: string): ProcessorActivityKind {
  switch (eventType) {
    case 'loan_capture':
    case 'loan_captured':
    case 'split_capture':
    case 'split_captured':
      return 'charge'
    case 'loan_refund':
    case 'loan_refunded':
    case 'partial_void':
      return 'refund'
    case 'merchant_fee':
    case 'fee_adjustment':
      return 'fee'
    case 'refund_voided':
    case 'dispute_opened':
    case 'dispute_resolved':
    case 'vcn_balance_adjustment':
      return 'adjustment'
    default:
      return 'unknown'
  }
}

/** The payout header shape `payoutEvidenceEnvelopeSchema` accepts. */
export interface AffirmPayoutEvidence {
  id: string
  status: string
  amount: string
  currency: string
  currencyExponent: number
  issuedAt: null
  issuedOn: string
  destinationExternalId: string | null
  raw: AffirmSettlementSummary
}

/**
 * The payout header from one `/settlements/daily` row.
 *
 * `deposit_id` is the payout identity on its own. ⚠️ Whether one `deposit_id`
 * can ever span two dates is unproven (probe §6.7); if it can, identity becomes
 * `${date}:${deposit_id}` and this is the one line that changes.
 *
 * `destinationExternalId` is `account_last_four` — a real bank reconciliation
 * key, which is more than Shopify Payments offers (it emits `null`).
 *
 * @example
 * payoutEvidence({ deposit_id: 'I5Y8PHAWWSSS2WJ', date: '2026-09-15', total_settled: 357930 })
 */
export function payoutEvidence(
  raw: AffirmSettlementSummary,
  options: AffirmEvidenceOptions = {}
): AffirmPayoutEvidence {
  const units = options.units ?? AFFIRM_SETTLEMENT_MONEY_UNITS
  const currency = readCurrency(raw.currency, options.currency)
  const currencyExponent = evidenceCurrencyExponent(currency)
  const removal = raw.removal_state

  return {
    id: affirmId(raw.deposit_id),
    // Affirm states only the NEGATIVE outcome. `failed` and `rejected` are the
    // documented removal states; any other value passes through verbatim so an
    // unfamiliar one is visible rather than silently read as settled.
    status: typeof removal === 'string' && removal.trim() !== '' ? removal : AFFIRM_SETTLED_STATUS,
    amount: evidenceAmount(
      affirmMinor(raw.total_settled, currencyExponent, units),
      currencyExponent
    ),
    currency,
    currencyExponent,
    // Affirm dates a settlement, it does not timestamp it.
    issuedAt: null,
    issuedOn: evidenceDate(raw.date),
    destinationExternalId: nullableId(raw.account_last_four),
    raw,
  }
}

/**
 * The processor entry shape, plus `providerType`.
 *
 * `providerType` mirrors the Shopify app's `balanceEvidence`, which carries the
 * provider's own word for the activity alongside the mapped kind. Note that
 * `processorBalanceEvidenceSchema` is `.strict()` and does NOT declare it, so
 * an envelope assembled for a literal `parse()` must extend the schema or drop
 * the key; the connector passes it through as a record field.
 */
export interface AffirmProcessorEvidence {
  id: string
  type: ProcessorActivityKind
  providerType: string
  gross: string
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
  raw: AffirmSettlementEvent
}

/**
 * One `/settlements/events` row as exact processor activity.
 *
 * `payoutId` is nullable on purpose: events with no `deposit_id` are real, and
 * the contract already tolerates them (build plan §3.4 rule 3). They are what
 * the standalone balance-transaction stream exists for.
 *
 * `sourceOrderId` is Affirm's `order_id` VERBATIM and is never parsed. For this
 * merchant it is the Shopify PaymentSession id — Affirm says so itself in
 * `checkout.metadata.transaction_id` — and it joins to the Shopify connector's
 * already-populated `customer_transaction_payment_id` (probe §4). A retained
 * wrong value is recoverable; a parsed one that overwrote the original is not.
 *
 * `mdr` is deliberately absent from the mapped fields and survives only in
 * `raw`: it is a rate, not money, and nothing downstream should compute from it.
 *
 * @example
 * processorEvidence({ id: 'EVT1', deposit_id: 'I5Y8PHAWWSSS2WJ', event_type: 'loan_captured' })
 */
export function processorEvidence(
  raw: AffirmSettlementEvent,
  options: AffirmEvidenceOptions = {}
): AffirmProcessorEvidence {
  if (typeof raw.event_type !== 'string' || raw.event_type === '') {
    throw new Error('Affirm returned a settlement event with no event type')
  }
  const units = options.units ?? AFFIRM_SETTLEMENT_MONEY_UNITS
  const currency = readCurrency(raw.currency, options.currency)
  const currencyExponent = evidenceCurrencyExponent(currency)

  // Affirm signs `fees` NEGATIVE; the contract wants a POSITIVE fee.
  //
  // 🛑 `transaction_fees` is NOT added here, and adding it is the bug this comment
  // exists to prevent. On the PUBLIC API `fees` is the WHOLE fee and
  // `transaction_fees` is a component breakdown OF it — verified against six live
  // deposits on 2026-09-16, every one of which satisfies
  // `total_settled == sales + fees` exactly, with `transaction_fees` outside the
  // arithmetic (`plans/apps/affirm/probe-public-api-2026-09-16.md`).
  //
  // The CSV export disagrees and is what misled the first implementation: it SPLITS
  // the same money into a `fees` column and a `txn_fees` column that sum to the
  // API's single `fees`. Summing both here double-counts the per-transaction fee —
  // 30 cents an event — which overstates fee expense and gross by the same amount
  // and still balances, so nothing downstream would ever catch it.
  const feeMinor = -optionalMinor(pick(raw, 'fees', 'total_fees'), currencyExponent, units)
  const netMinor = affirmMinor(raw.total_settled, currencyExponent, units)
  // DERIVED, so `gross - fee === net` holds by construction. See the file docblock.
  const grossMinor = netMinor + feeMinor

  return {
    id: affirmId(raw.id),
    type: affirmActivityKind(raw.event_type),
    providerType: raw.event_type,
    gross: evidenceAmount(grossMinor, currencyExponent),
    fee: evidenceAmount(feeMinor, currencyExponent),
    net: evidenceAmount(netMinor, currencyExponent),
    currency,
    currencyExponent,
    // `effective_date` FIRST, `date` only as a fallback — reversed from the
    // build plan's guess by the 2026-09-16 probe, which showed the two are not
    // interchangeable. `date` is the SETTLEMENT date and is date-only
    // (`2026-09-15`); `effective_date` is an offset-bearing timestamp of when
    // the capture itself happened (`2026-09-14T19:28:14Z`), and they routinely
    // fall on different days. The contract wants an offset-bearing datetime and
    // means the entry's own occurrence time — Shopify's equivalent maps
    // `processed_at` — so the timestamp is the more accurate answer, and it is
    // real rather than a midnight this app invented. The deposit's date is not
    // lost: it stays on the payout header's `issuedOn`.
    transactionDate: evidenceTimestamp(pick(raw, 'effective_date', 'date')),
    payoutId: nullableId(raw.deposit_id),
    sourceTransactionId: nullableId(raw.transaction_id),
    sourceOrderId: nullableId(raw.order_id),
    sourceId: nullableId(pick(raw, 'purchase_id', 'transaction_event_id')),
    // Affirm has no counterpart to Shopify's `source_type`. Left null rather
    // than invented; `providerType` already names the activity.
    sourceType: null,
    raw,
  }
}

/** Row currency, then the caller's, then the region default. */
function readCurrency(value: unknown, fallback: string | undefined): string {
  if (typeof value === 'string' && /^[A-Za-z]{3}$/.test(value)) return value.toUpperCase()
  if (value !== undefined && value !== null && value !== '') {
    throw new Error('Affirm returned an invalid settlement currency')
  }
  return fallback ?? AFFIRM_DEFAULT_CURRENCY
}
