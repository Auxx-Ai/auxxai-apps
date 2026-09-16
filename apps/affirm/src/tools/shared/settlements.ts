// src/tools/shared/settlements.ts

/**
 * Settlement fetching and projection, shared by the connector and the tools.
 *
 * There is exactly ONE implementation of "read a page of Affirm settlements"
 * in this app, and this is it. `affirm.connector.server.ts` and
 * `list_affirm_settlements` / `list_affirm_settlement_events` all call the
 * functions below, so a tool and a sync can never disagree about what Affirm
 * said (build plan §8: *"they share fetch and projection code; they are not a
 * second implementation"*).
 *
 * Affirm's JSON is still only understood in `settlement-evidence.ts` — this
 * module fetches pages and re-shapes the CONTRACT objects that file returns.
 *
 * ## The shape difference that governs membership (build plan §3.4)
 *
 * Shopify names a `payout_id` on its balance transactions. Affirm does not:
 * `/settlements/events` documents **no `deposit_id` filter**, only a date
 * range. So a deposit's members are never fetched directly — they are obtained
 * by paging the event feed over a **widened** window around the summary's date
 * and grouping on `deposit_id` LOCALLY. `widenSettlementWindow` is that
 * widening, and it exists because a summary's `date` and an event's `date`
 * need not share a calendar boundary (`effective_date` exists precisely
 * because they diverge).
 */

import {
  type AffirmEvidenceOptions,
  type AffirmSettlementEvent,
  type AffirmSettlementSummary,
  type ProcessorActivityKind,
  affirmMinor,
  evidenceAmount,
  payoutEvidence,
  processorEvidence,
} from '../../settlement-evidence'
import { type AffirmQuery, affirmApi, affirmPageQuery } from './affirm-api'
import type { AffirmCredentials } from './connection'

/** The payout header feed — one row per settlement date. */
export const AFFIRM_SETTLEMENTS_DAILY = '/settlements/daily'

/** The flat event feed. No `deposit_id` filter exists; grouping is local. */
export const AFFIRM_SETTLEMENTS_EVENTS = '/settlements/events'

/**
 * Rows per settlement page.
 *
 * NOT Affirm's maximum (1000). `payoutRecordEvidenceSchema` caps a persisted
 * membership page at **250** entries and 250 raw rows, so a larger page would
 * be rejected by the platform after the credential had already been spent on
 * it. The events feed is read at this size for both streams so the two agree.
 */
export const AFFIRM_SETTLEMENT_PAGE_LIMIT = 250

/**
 * Days added to each side of a deposit's date when scanning for its members.
 *
 * ⚠️ One day is the build plan's stated minimum, not a proven sufficiency: no
 * deposit with a member outside its own date has been observed. Widening
 * further costs only reads, because grouping is on `deposit_id` and never on
 * date equality.
 */
export const AFFIRM_MEMBER_WINDOW_DAYS = 1

/** One page of settlement rows plus Affirm's own resume token. */
export interface AffirmSettlementPage<T> {
  rows: T[]
  /**
   * Affirm's `next_page` value VERBATIM, or null on the last page. Documented
   * as *"URL-encoded pagination parameters"*, so it is re-issued as query
   * parameters against our own pinned origin — never followed as a URL. See
   * `affirmPageQuery`.
   */
  nextPage: string | null
}

/** A bounded read over the settlement feeds. */
export interface AffirmSettlementWindow {
  /** Inclusive start date, `YYYY-MM-DD`. */
  after?: string
  /** End date, `YYYY-MM-DD`. ⚠️ Inclusive or exclusive is unproven. */
  before?: string
  /** Rows per page. Defaults to {@link AFFIRM_SETTLEMENT_PAGE_LIMIT}. */
  limit?: number
  /** The PREVIOUS page's `next_page`, to resume from. */
  page?: string | null
}

/**
 * Build the query for one settlement page.
 *
 * ⚠️ GUESS: the window bounds are sent ALONGSIDE the resumed cursor rather than
 * instead of it, with the cursor's own parameters last so they win on conflict.
 * Affirm's four-part cursor is undocumented as to whether it re-states the
 * range, and sending a bound we know to be correct is safer than dropping it.
 */
function windowQuery(window: AffirmSettlementWindow): AffirmQuery {
  const page = affirmPageQuery(window.page)
  return {
    after: window.after,
    before: window.before,
    // The API's own default page size is 5, so this is always sent.
    limit: window.limit ?? AFFIRM_SETTLEMENT_PAGE_LIMIT,
    ...(page ?? {}),
  }
}

/**
 * Read the row collection out of a settlement response.
 *
 * ✔ The envelope key is **`data`** on BOTH endpoints — the name Affirm's API
 * reference uses, not the portal's `settlements` (observed live 2026-09-16), so
 * `data` is tried first. The tolerance behind it stays: three disagreeing
 * vocabularies for these payloads exist (the API reference, the portal JSON and
 * the CSV export), so the other documented keys are tried next and then any
 * single array-valued member, rather than failing a whole sync on one name.
 */
function readRows<T>(body: unknown, ...keys: string[]): T[] {
  // An empty body is an empty page, not a malformed one.
  if (body === undefined || body === null) return []
  if (Array.isArray(body)) return body as T[]
  if (typeof body !== 'object') {
    throw new Error('Affirm returned a settlement response that was not a collection')
  }
  const record = body as Record<string, unknown>
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[]
  }
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) return value as T[]
  }
  throw new Error('Affirm returned a settlement response with no rows')
}

/** Affirm's resume token, or null. A blank one is the last page, not a cursor. */
function readNextPage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const value = (body as { next_page?: unknown }).next_page
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

/**
 * One page of `/settlements/daily` — the payout headers.
 *
 * @example
 * const page = await fetchSettlements(credentials, { after: '2026-09-01', limit: 1 })
 */
export async function fetchSettlements(
  credentials: AffirmCredentials,
  window: AffirmSettlementWindow = {}
): Promise<AffirmSettlementPage<AffirmSettlementSummary>> {
  const body = await affirmApi<unknown>({
    endpoint: AFFIRM_SETTLEMENTS_DAILY,
    credentials,
    query: windowQuery(window),
  })
  return {
    rows: readRows<AffirmSettlementSummary>(body, 'data', 'settlements', 'results', 'daily'),
    nextPage: readNextPage(body),
  }
}

/**
 * One page of `/settlements/events` — the flat event feed.
 *
 * Every row is returned, INCLUDING rows with no `deposit_id`: those are real
 * and are what the standalone `balance_transaction` stream exists for. Callers
 * that want one deposit's members filter locally; there is no server-side
 * filter to ask for.
 */
export async function fetchSettlementEvents(
  credentials: AffirmCredentials,
  window: AffirmSettlementWindow = {}
): Promise<AffirmSettlementPage<AffirmSettlementEvent>> {
  const body = await affirmApi<unknown>({
    endpoint: AFFIRM_SETTLEMENTS_EVENTS,
    credentials,
    query: windowQuery(window),
  })
  return {
    rows: readRows<AffirmSettlementEvent>(body, 'data', 'events', 'results', 'settlement_events'),
    nextPage: readNextPage(body),
  }
}

/** Shift a `YYYY-MM-DD` calendar date by whole UTC days. */
function shiftDate(date: string, days: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`)
  if (!Number.isFinite(ms)) throw new Error(`Affirm returned an invalid settlement date: ${date}`)
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10)
}

/**
 * The date window to scan for one deposit's members.
 *
 * Widened on BOTH sides, because Affirm's own `effective_date` field is the
 * admission that a settlement's date and its events' dates diverge. Grouping
 * is then on `deposit_id` and never on date equality, so over-widening costs
 * reads and nothing else — under-widening silently loses members and posts the
 * deposit short.
 *
 * @example
 * widenSettlementWindow('2026-09-15') // { after: '2026-09-14', before: '2026-09-16' }
 */
export function widenSettlementWindow(
  date: string,
  days: number = AFFIRM_MEMBER_WINDOW_DAYS
): { after: string; before: string } {
  return { after: shiftDate(date, -days), before: shiftDate(date, days) }
}

/**
 * Keep only the rows belonging to one deposit.
 *
 * This is the local grouping that stands in for the filter Affirm does not
 * offer. `deposit_id` is compared as the opaque string it is — never parsed,
 * never trimmed, never cased.
 */
export function groupByDeposit<T extends AffirmSettlementEvent>(rows: T[], depositId: string): T[] {
  return rows.filter((row) => row.deposit_id === depositId)
}

/** A settlement header, flattened for a staff-facing tool. */
export interface ProjectedSettlement {
  /** The id the merchant sees on their bank statement, e.g. `I5Y8PHAWWSSS2WJ`. */
  depositId: string
  date: string
  /** `paid`, or Affirm's `removal_state` verbatim when the money did not move. */
  status: string
  /** Exact decimal string. The amount that hit the bank. */
  totalSettled: string
  currency: string
  currencyExponent: number
  accountLastFour: string | null
  /** Affirm's own reported figures, exact decimal. Fees stay NEGATIVE here. */
  reportedSales: string | null
  reportedRefunds: string | null
  reportedFees: string | null
}

/**
 * Project one `/settlements/daily` row for display.
 *
 * The contract-bearing values come from `payoutEvidence`, so a tool and the
 * connector cannot disagree. The three `reported*` figures are Affirm's own
 * signed numbers, carried through the same exact-decimal machinery — they are
 * for a human reading a deposit, and nothing computes from them.
 */
export function projectSettlement(
  raw: AffirmSettlementSummary,
  options: AffirmEvidenceOptions = {}
): ProjectedSettlement {
  const header = payoutEvidence(raw, options)
  const reported = (value: unknown): string | null =>
    value === undefined || value === null || value === ''
      ? null
      : evidenceAmount(
          affirmMinor(value, header.currencyExponent, options.units),
          header.currencyExponent
        )

  return {
    depositId: header.id,
    date: header.issuedOn,
    status: header.status,
    totalSettled: header.amount,
    currency: header.currency,
    currencyExponent: header.currencyExponent,
    accountLastFour: header.destinationExternalId,
    reportedSales: reported(raw.total_sales ?? raw.sales),
    reportedRefunds: reported(raw.total_refunds ?? raw.refunds),
    reportedFees: reported(raw.total_fees ?? raw.fees),
  }
}

/** A settlement event, flattened for a staff-facing tool. */
export interface ProjectedSettlementEvent {
  id: string
  /** Null is legal and expected — not every event belongs to a deposit. */
  depositId: string | null
  date: string | null
  /** The platform's mapped activity kind. `unknown` is a visible outcome. */
  type: ProcessorActivityKind
  /** Affirm's own `event_type`, e.g. `loan_capture`. */
  providerType: string
  /** Exact decimals. `gross - fee === net`, and `fee` is POSITIVE. */
  gross: string
  fee: string
  net: string
  currency: string
  /** Affirm's `order_id` VERBATIM — for this merchant, a Shopify PaymentSession id. */
  orderId: string | null
  transactionId: string | null
  sourceId: string | null
}

/** Project one `/settlements/events` row for display, through the contract. */
export function projectSettlementEvent(
  raw: AffirmSettlementEvent,
  options: AffirmEvidenceOptions = {}
): ProjectedSettlementEvent {
  const entry = processorEvidence(raw, options)
  return {
    id: entry.id,
    depositId: entry.payoutId,
    date: entry.transactionDate,
    type: entry.type,
    providerType: entry.providerType,
    gross: entry.gross,
    fee: entry.fee,
    net: entry.net,
    currency: entry.currency,
    orderId: entry.sourceOrderId,
    transactionId: entry.sourceTransactionId,
    sourceId: entry.sourceId,
  }
}
