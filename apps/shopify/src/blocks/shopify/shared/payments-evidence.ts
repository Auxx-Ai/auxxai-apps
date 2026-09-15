// src/blocks/shopify/shared/payments-evidence.ts

import type { RawBalanceTransaction, RawPayout } from './payments-api'

/** A provider decimal stays a string across the connector boundary. */
export function exactEvidenceAmount(value: unknown): string {
  if (typeof value !== 'string' || !/^-?(0|[1-9]\d*)(\.\d+)?$/.test(value)) {
    throw new Error('Shopify Payments returned an invalid decimal amount')
  }
  return value
}

/** ISO currency precision, matching the platform money contract. */
export function evidenceCurrencyExponent(currency: string): number {
  // The app runs on the platform's Node runtime; its author tsconfig targets ES2020.
  const currencyIntl = Intl as typeof Intl & { supportedValuesOf(key: 'currency'): string[] }
  if (!currencyIntl.supportedValuesOf('currency').includes(currency)) {
    throw new Error(`Shopify Payments returned an unsupported currency: ${currency}`)
  }
  return (
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  )
}

/** Reject unsafe numeric IDs instead of linking an already-rounded provider identity. */
export function evidenceId(value: unknown): string {
  if (
    (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) ||
    (typeof value === 'string' && /^[1-9]\d*$/.test(value))
  )
    return String(value)
  throw new Error('Shopify Payments returned an invalid or unsafe source ID')
}

const nullableId = (value: unknown): string | null => (value == null ? null : evidenceId(value))

/** Independent provider header amount, date precision and lifecycle evidence. */
export function payoutEvidence(raw: RawPayout) {
  if (
    typeof raw.status !== 'string' ||
    !raw.status ||
    typeof raw.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) ||
    !Number.isFinite(Date.parse(raw.date)) ||
    new Date(raw.date).toISOString().slice(0, 10) !== raw.date
  )
    throw new Error('Shopify Payments returned an invalid payout lifecycle or issue date')
  return {
    id: evidenceId(raw.id),
    status: raw.status,
    amount: exactEvidenceAmount(raw.amount),
    currency: raw.currency,
    currencyExponent: evidenceCurrencyExponent(raw.currency),
    issuedAt: null,
    issuedOn: raw.date,
    destinationExternalId: null,
    raw,
  }
}

/** Translate provider activity without making unknown movements eligible for settlement. */
export function balanceActivity(type: string) {
  switch (type) {
    case 'charge':
    case 'refund':
    case 'fee':
    case 'adjustment':
      return type
    case 'payout':
      return 'outgoing_transfer'
    case 'payout_failure':
    case 'payout_cancellation':
      return 'returned_transfer'
    default:
      return 'unknown'
  }
}

/** Exact processor activity, retaining unassigned entries and outgoing payout movements. */
export function balanceEvidence(raw: RawBalanceTransaction) {
  if (typeof raw.type !== 'string' || !raw.type)
    throw new Error('Shopify Payments returned an invalid transaction type')
  if (
    raw.processed_at != null &&
    (typeof raw.processed_at !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        raw.processed_at,
      ) ||
      !Number.isFinite(Date.parse(raw.processed_at)))
  )
    throw new Error('Shopify Payments returned an invalid transaction date')
  return {
    id: evidenceId(raw.id),
    type: balanceActivity(raw.type),
    providerType: raw.type,
    gross: exactEvidenceAmount(raw.amount),
    fee: exactEvidenceAmount(raw.fee),
    net: exactEvidenceAmount(raw.net),
    currency: raw.currency,
    currencyExponent: evidenceCurrencyExponent(raw.currency),
    transactionDate: raw.processed_at ?? null,
    payoutId: nullableId(raw.payout_id),
    sourceTransactionId: nullableId(raw.source_order_transaction_id),
    sourceOrderId: nullableId(raw.source_order_id),
    sourceId: nullableId(raw.source_id),
    sourceType: raw.source_type ?? null,
    raw,
  }
}
