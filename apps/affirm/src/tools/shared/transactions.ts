// src/tools/shared/transactions.ts

/**
 * Charge fetching and projection — the `/api/v1/transactions` surface.
 *
 * This is the app's SECOND reason to exist (build plan §1 capability 2): what
 * a customer financed, and the fallback path for order recognition. It writes
 * NO records. ⚠️ Charges are deliberately tools-only and have no connector
 * stream: the obvious target would be `customer_transaction`, but the Shopify
 * connector already writes that row for the same payment under a different
 * `sourceKey`, so an Affirm-sourced row would be a SECOND customer transaction
 * for one customer payment (build plan §8).
 *
 * ## Units are PROVEN here, unlike settlements
 *
 * The probe read charge `CPDZ-ANRU` live and saw `"amount": 374005` against a
 * settlement of `$3,740.05` — integer cents. That is an observation, not the
 * inference `settlement-evidence.ts` has to make about the settlement feed, so
 * this module states its own convention rather than borrowing that file's
 * unproven switch.
 *
 * ## PII
 *
 * ⚠️ An expanded checkout carries a real customer's NAME, EMAIL and ADDRESS —
 * the probe deleted its captured response for exactly that reason. Nothing
 * below projects those fields. `expand=checkout` is requested only on the
 * single-charge read, and only `checkout.metadata` (platform, the Shopify
 * PaymentSession gid, the reference) is surfaced. A tool result is agent
 * context; it should not be a customer data export.
 */

import {
  AFFIRM_DEFAULT_CURRENCY,
  type AffirmMoneyUnits,
  affirmId,
  affirmMinor,
  evidenceAmount,
  evidenceCurrencyExponent,
} from '../../settlement-evidence'
import { affirmApi } from './affirm-api'
import type { AffirmCredentials } from './connection'

/** The charges endpoint. */
export const AFFIRM_TRANSACTIONS = '/transactions'

/**
 * How the transactions API reports money.
 *
 * ✔ PROVEN by the probe: `amount: 374005` for a `$3,740.05` charge.
 */
export const AFFIRM_TRANSACTION_MONEY_UNITS: AffirmMoneyUnits = 'minor'

/** One event on a charge (`auth`, `capture`, …). */
export interface AffirmChargeEvent {
  id?: unknown
  type?: unknown
  amount?: unknown
  created?: unknown
  [key: string]: unknown
}

/** A charge as `/transactions` returns it. Members stay open — Affirm adds keys. */
export interface AffirmCharge {
  id?: unknown
  order_id?: unknown
  amount?: unknown
  amount_refunded?: unknown
  status?: unknown
  currency?: unknown
  created?: unknown
  authorization_expiration?: unknown
  checkout_id?: unknown
  events?: unknown
  checkout?: unknown
  [key: string]: unknown
}

/** A charge, flattened. No customer identity of any kind. */
export interface ProjectedCharge {
  /** The charge ARI, e.g. `CPDZ-ANRU`. */
  id: string
  /** Affirm's `order_id` VERBATIM — the Shopify PaymentSession id for this merchant. */
  orderId: string | null
  status: string | null
  /** Exact decimal string. */
  amount: string
  amountRefunded: string | null
  currency: string
  created: string | null
  authorizationExpiration: string | null
  checkoutId: string | null
  eventCount: number
}

/** A single charge, plus the checkout metadata that proves the order link. */
export interface ProjectedChargeDetail extends ProjectedCharge {
  events: {
    id: string | null
    type: string | null
    amount: string | null
    created: string | null
  }[]
  /**
   * `checkout.metadata.transaction_id`, VERBATIM — e.g.
   * `gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL`.
   *
   * This is build plan §6 rule 4: when a settlement event's `order_id` does
   * not match anything, the charge states the Shopify payment session outright
   * and resolves it. Never parsed here; a retained wrong value is recoverable,
   * a parsed one that overwrote the original is not.
   */
  shopifyPaymentSessionId: string | null
  /** `checkout.metadata.platform_type`, e.g. `Shopify`. */
  platformType: string | null
  /** `checkout.order_id`, which should equal `orderId`. A mismatch is a finding. */
  checkoutOrderId: string | null
}

/** A charge currency, defaulting to the region's. */
function chargeCurrency(value: unknown): string {
  if (typeof value === 'string' && /^[A-Za-z]{3}$/.test(value)) return value.toUpperCase()
  return AFFIRM_DEFAULT_CURRENCY
}

const optionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null

/** Project a charge. Throws only when the charge has no usable identity. */
export function projectCharge(raw: AffirmCharge): ProjectedCharge {
  const currency = chargeCurrency(raw.currency)
  const exponent = evidenceCurrencyExponent(currency)
  const amount = (value: unknown): string | null =>
    value === undefined || value === null || value === ''
      ? null
      : evidenceAmount(affirmMinor(value, exponent, AFFIRM_TRANSACTION_MONEY_UNITS), exponent)

  return {
    id: affirmId(raw.id),
    orderId: optionalText(raw.order_id),
    status: optionalText(raw.status),
    amount: amount(raw.amount) ?? evidenceAmount(BigInt(0), exponent),
    amountRefunded: amount(raw.amount_refunded),
    currency,
    created: optionalText(raw.created),
    authorizationExpiration: optionalText(raw.authorization_expiration),
    checkoutId: optionalText(raw.checkout_id),
    eventCount: Array.isArray(raw.events) ? raw.events.length : 0,
  }
}

/** Project a charge with its events and the checkout metadata. No PII. */
export function projectChargeDetail(raw: AffirmCharge): ProjectedChargeDetail {
  const base = projectCharge(raw)
  const exponent = evidenceCurrencyExponent(base.currency)
  const checkout = (raw.checkout ?? {}) as Record<string, unknown>
  const metadata = (checkout.metadata ?? {}) as Record<string, unknown>
  const rawEvents: AffirmChargeEvent[] = Array.isArray(raw.events)
    ? (raw.events as AffirmChargeEvent[])
    : []

  return {
    ...base,
    events: rawEvents.map((event) => ({
      id: optionalText(event.id),
      type: optionalText(event.type),
      amount:
        event.amount === undefined || event.amount === null || event.amount === ''
          ? null
          : evidenceAmount(
              affirmMinor(event.amount, exponent, AFFIRM_TRANSACTION_MONEY_UNITS),
              exponent
            ),
      created: optionalText(event.created),
    })),
    shopifyPaymentSessionId: optionalText(metadata.transaction_id),
    platformType: optionalText(metadata.platform_type),
    checkoutOrderId: optionalText(checkout.order_id),
  }
}

/** A bounded charge read. */
export interface AffirmChargeQuery {
  /** ISO-8601 instant; sent as `after_timestamp` in epoch MILLISECONDS. */
  after?: string
  /** ISO-8601 instant; sent as `before_timestamp` in epoch MILLISECONDS. */
  before?: string
  limit?: number
  /** Request `expand=checkout`. Only ever set on a single-charge read. */
  expandCheckout?: boolean
}

/** One page of charges, with Affirm's own has-more flags. */
export interface AffirmChargePage {
  rows: AffirmCharge[]
  hasNext: boolean
  hasPrev: boolean
}

function epochMillis(value: string | undefined, label: string): number | undefined {
  if (value === undefined || value === '') return undefined
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) throw new Error(`${label} is not a valid ISO-8601 timestamp`)
  return ms
}

/**
 * One page of charges. ✔ This is the endpoint the merchant portal's own
 * Charges page calls, verified live.
 *
 * ⚠️ GUESS: Affirm documents the response as `{has_prev, has_next,
 * transactions[]}` but no cursor, so paging here is by narrowing the timestamp
 * window rather than by a resume token. `hasNext` is surfaced so a caller can
 * say so honestly instead of implying it saw everything.
 */
export async function fetchCharges(
  credentials: AffirmCredentials,
  query: AffirmChargeQuery = {}
): Promise<AffirmChargePage> {
  const body = await affirmApi<Record<string, unknown>>({
    endpoint: AFFIRM_TRANSACTIONS,
    credentials,
    query: {
      transaction_type: 'charge',
      after_timestamp: epochMillis(query.after, 'after'),
      before_timestamp: epochMillis(query.before, 'before'),
      limit: query.limit,
      expand: query.expandCheckout ? 'checkout' : undefined,
    },
  })
  const rows = Array.isArray(body?.transactions) ? (body.transactions as AffirmCharge[]) : []
  return {
    rows,
    hasNext: body?.has_next === true,
    hasPrev: body?.has_prev === true,
  }
}

/**
 * One charge by its ARI, with the checkout expanded.
 *
 * `expand=checkout` is what makes `checkout.metadata.transaction_id` available
 * — the order-recognition fallback of build plan §6 rule 4.
 */
export async function fetchCharge(
  credentials: AffirmCredentials,
  chargeId: string
): Promise<AffirmCharge> {
  const body = await affirmApi<AffirmCharge>({
    endpoint: `${AFFIRM_TRANSACTIONS}/${encodeURIComponent(chargeId)}`,
    credentials,
    query: { expand: 'checkout' },
  })
  if (!body || typeof body !== 'object') {
    throw new Error(`Affirm returned no charge for ${chargeId}`)
  }
  return body
}
