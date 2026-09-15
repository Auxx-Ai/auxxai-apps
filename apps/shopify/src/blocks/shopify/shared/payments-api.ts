// src/blocks/shopify/shared/payments-api.ts
//
// Every Shopify Payments HTTP call lives here (money design gap-a §1.3): REST
// `shopify_payments/*` because `payout_id` is a first-class REST filter that GraphQL does
// not offer, and because REST returns `source_order_id` flat. Consumers see the projected
// shape, never a raw body, so a later GraphQL rewrite is this one file.

import { UpstreamServiceError } from '@auxx/sdk/server'
import { API_VERSION, throwShopifyResponseError } from './shopify-api'

/** Shopify's page ceiling for these endpoints. */
const PAGE_LIMIT = '250'

export type PayoutStatus = 'scheduled' | 'in_transit' | 'paid' | 'failed' | 'canceled'

export const PAYOUT_STATUSES: readonly PayoutStatus[] = [
  'scheduled',
  'in_transit',
  'paid',
  'failed',
  'canceled',
]

/** One REST payout body, the fields this app reads. */
export interface RawPayout {
  id: number
  status: PayoutStatus
  /** YYYY-MM-DD */
  date: string
  currency: string
  /** Decimal major-unit string, e.g. "1234.56" */
  amount: string
  summary: {
    adjustments_fee_amount: string
    adjustments_gross_amount: string
    charges_fee_amount: string
    charges_gross_amount: string
    refunds_fee_amount: string
    refunds_gross_amount: string
    reserved_funds_fee_amount: string
    reserved_funds_gross_amount: string
    retried_payouts_fee_amount: string
    retried_payouts_gross_amount: string
  }
}

/** One REST balance transaction body, the fields this app reads. */
export interface RawBalanceTransaction {
  id: number
  type: string
  test: boolean
  payout_id: number | null
  payout_status: string
  currency: string
  amount: string
  fee: string
  net: string
  source_id: number | null
  source_type: string | null
  source_order_id: number | null
  source_order_transaction_id: number | null
  processed_at: string
}

export interface PayoutRecord {
  id: string
  status: PayoutStatus
  /** YYYY-MM-DD, the day the payout was (or is to be) deposited. */
  date: string
  currency: string
  /** The deposit, integer minor units. Transcribed from `amount`, never summed. */
  amountMinor: number
  summary: {
    adjustmentsFeeMinor: number
    adjustmentsGrossMinor: number
    chargesFeeMinor: number
    chargesGrossMinor: number
    refundsFeeMinor: number
    refundsGrossMinor: number
    reservedFundsFeeMinor: number
    reservedFundsGrossMinor: number
    retriedPayoutsFeeMinor: number
    retriedPayoutsGrossMinor: number
  }
}

export interface PayoutTransactionRecord {
  id: string
  type: string
  test: boolean
  /** Gross, integer minor units. Negative for a refund or dispute. */
  amountMinor: number
  feeMinor: number
  netMinor: number
  sourceId: string | null
  sourceType: string | null
  /** Same numeric keyspace as REST `Order.id`, so it matches the connector's order externalId. */
  sourceOrderId: string | null
  sourceOrderTransactionId: string | null
  processedAt: string
}

/**
 * Shopify reports money as a decimal major-unit string; the platform wants integer minor
 * units. Same arithmetic as the connector's `decimalToMinorUnits`, but a payout amount that
 * does not parse is a wrong read, not "no value", so this refuses instead of returning null.
 */
export function decimalToMinorUnits(decimal: string | number | null | undefined): number {
  const parsed = Number.parseFloat(String(decimal ?? ''))
  if (!Number.isFinite(parsed)) {
    throw new UpstreamServiceError(`Shopify returned a non-numeric amount: ${String(decimal)}`)
  }
  return Math.round(parsed * 100)
}

export function mapPayout(raw: RawPayout): PayoutRecord {
  const s = raw.summary ?? ({} as RawPayout['summary'])
  return {
    id: String(raw.id),
    status: raw.status,
    date: raw.date,
    currency: raw.currency,
    amountMinor: decimalToMinorUnits(raw.amount),
    summary: {
      adjustmentsFeeMinor: decimalToMinorUnits(s.adjustments_fee_amount ?? '0'),
      adjustmentsGrossMinor: decimalToMinorUnits(s.adjustments_gross_amount ?? '0'),
      chargesFeeMinor: decimalToMinorUnits(s.charges_fee_amount ?? '0'),
      chargesGrossMinor: decimalToMinorUnits(s.charges_gross_amount ?? '0'),
      refundsFeeMinor: decimalToMinorUnits(s.refunds_fee_amount ?? '0'),
      refundsGrossMinor: decimalToMinorUnits(s.refunds_gross_amount ?? '0'),
      reservedFundsFeeMinor: decimalToMinorUnits(s.reserved_funds_fee_amount ?? '0'),
      reservedFundsGrossMinor: decimalToMinorUnits(s.reserved_funds_gross_amount ?? '0'),
      retriedPayoutsFeeMinor: decimalToMinorUnits(s.retried_payouts_fee_amount ?? '0'),
      retriedPayoutsGrossMinor: decimalToMinorUnits(s.retried_payouts_gross_amount ?? '0'),
    },
  }
}

export function mapBalanceTransaction(raw: RawBalanceTransaction): PayoutTransactionRecord {
  const idOrNull = (v: number | null | undefined) =>
    v === null || v === undefined ? null : String(v)
  return {
    id: String(raw.id),
    type: raw.type,
    test: Boolean(raw.test),
    amountMinor: decimalToMinorUnits(raw.amount),
    feeMinor: decimalToMinorUnits(raw.fee),
    netMinor: decimalToMinorUnits(raw.net),
    sourceId: idOrNull(raw.source_id),
    sourceType: raw.source_type ?? null,
    sourceOrderId: idOrNull(raw.source_order_id),
    sourceOrderTransactionId: idOrNull(raw.source_order_transaction_id),
    processedAt: raw.processed_at,
  }
}

/**
 * Drain one REST collection to exhaustion by following the `Link: rel="next"` header.
 *
 * Deliberately NOT `shopifyApiGetAll`: that pager stops silently at 50 pages, and for a
 * settlement a truncated read is a WRONG read (brief 27 §4). There is no page cap here, and
 * any page failure throws instead of returning what was gathered so far.
 */
export async function shopifyPaymentsGetAll<T>(
  shopDomain: string,
  accessToken: string,
  path: string,
  resourceKey: string,
  qs: Record<string, string>,
): Promise<T[]> {
  const url = new URL(`https://${shopDomain}/admin/api/${API_VERSION}${path}`)
  for (const [k, v] of Object.entries(qs)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, v)
  }
  url.searchParams.set('limit', PAGE_LIMIT)

  const items: T[] = []
  let currentUrl: string | undefined = url.toString()

  while (currentUrl) {
    let response: Response
    try {
      response = await fetch(currentUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      throw new UpstreamServiceError(err instanceof Error ? err.message : 'Shopify request failed')
    }

    if (!response.ok) await throwShopifyResponseError(response)

    const data = (await response.json()) as Record<string, T[] | undefined>
    const batch = data[resourceKey]
    if (!Array.isArray(batch)) {
      throw new UpstreamServiceError(`Shopify response has no "${resourceKey}" collection`)
    }
    items.push(...batch)

    currentUrl = nextPageUrl(response.headers.get('Link'))
  }

  return items
}

function nextPageUrl(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
  return match ? match[1] : undefined
}

/** Every payout in the window, oldest first. `dateMin`/`dateMax` are inclusive YYYY-MM-DD. */
export async function listAllPayouts(
  shopDomain: string,
  accessToken: string,
  params: { dateMin: string; dateMax?: string; status?: PayoutStatus },
): Promise<PayoutRecord[]> {
  const raw = await shopifyPaymentsGetAll<RawPayout>(
    shopDomain,
    accessToken,
    '/shopify_payments/payouts.json',
    'payouts',
    {
      date_min: params.dateMin,
      date_max: params.dateMax ?? '',
      status: params.status ?? '',
    },
  )
  // Shopify lists newest first; the platform walks a rail forward, so hand it oldest first.
  return raw
    .map(mapPayout)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : Number(a.id) - Number(b.id)))
}

/**
 * Every balance transaction inside one payout. Refuses if Shopify hands back a row from a
 * different payout: a filter that was silently not applied would otherwise post another
 * payout's items into this one.
 */
export async function listAllPayoutTransactions(
  shopDomain: string,
  accessToken: string,
  payoutId: string,
): Promise<PayoutTransactionRecord[]> {
  const raw = await shopifyPaymentsGetAll<RawBalanceTransaction>(
    shopDomain,
    accessToken,
    '/shopify_payments/balance/transactions.json',
    'transactions',
    { payout_id: payoutId },
  )
  const stray = raw.find((t) => String(t.payout_id) !== payoutId)
  if (stray) {
    throw new UpstreamServiceError(
      `Shopify returned transaction ${stray.id} of payout ${String(stray.payout_id)} while listing payout ${payoutId}`,
    )
  }
  return raw.map(mapBalanceTransaction)
}
