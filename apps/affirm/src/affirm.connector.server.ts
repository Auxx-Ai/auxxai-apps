// src/affirm.connector.server.ts

/**
 * The Affirm financial-source sync: paging, cursor, membership, throttle.
 *
 * One page per `execute`. The platform drives the loop — this returns one page
 * of records plus the cursor to resume from, and is re-invoked until a page
 * returns no cursor. `query.period` bounds the settlement dates read.
 *
 * ## Why this is not simply Shopify's handler
 *
 * Shopify hands you a payout resource and a balance-transaction resource that
 * names its own `payout_id`, so membership is one filtered request. Affirm
 * gives a **daily summary** and a **flat event feed with no `deposit_id`
 * filter** (build plan §3.4). So the `members` phase pages the event feed over
 * a **widened** date window around the summary's date and groups on
 * `deposit_id` locally. The state machine is Shopify's; the paging is not.
 *
 * ## Membership honesty is the load-bearing part
 *
 * A deposit whose window has not been fully paged is `complete: false` with a
 * `reason` — never a short answer. `assessPayoutMembership` reads that flag,
 * and lying about it is exactly how a deposit posts short. Every early return
 * below therefore carries a reason string rather than an empty entry list that
 * happens to claim completeness.
 *
 * ## Cursor discipline
 *
 * - **429 returns `rateLimited`.** It never sleeps: the platform pauses the
 *   chain and re-invokes with the SAME cursor, so the connector does not burn
 *   its sandbox budget waiting.
 * - **No `since` is ever returned.** The template suggests advancing a
 *   watermark to the newest row seen; that is wrong for reconciliation. A
 *   settlement date is not an update timestamp, and a watermark advanced past
 *   a page we failed to read is a deposit that silently never arrives. This
 *   connector re-reads history deliberately, and identity-matches on
 *   `sourceKey`, so a second sync creates no duplicate rows.
 * - A repeated page cursor is treated as a provider fault, not as progress.
 *
 * ## No `PayoutSource`
 *
 * Build plan §5.3, resolved: the registry path and this one are mutually
 * exclusive by construction. `assertLegacyPayoutIngestionOwner` refuses the
 * legacy writer once a connector holds an enabled `upsert` mapping into
 * `payout` / `processor_balance_entry` — which is precisely what
 * `affirm.connector.ts` declares. That refusal is the designed outcome.
 */

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorQuery,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { payoutSourceFields, processorSourceFields } from '@auxx/sdk/financial-source'
import { RateLimitError } from '@auxx/sdk/server'
import {
  type AffirmSettlementEvent,
  type AffirmSettlementSummary,
  affirmId,
  payoutEvidence,
  processorEvidence,
} from './settlement-evidence'
import { type AffirmCredentials, affirmCredentialsFrom } from './tools/shared/connection'
import {
  AFFIRM_MEMBER_WINDOW_DAYS,
  AFFIRM_SETTLEMENT_PAGE_LIMIT,
  fetchSettlementEvents,
  fetchSettlements,
  groupByDeposit,
  widenSettlementWindow,
} from './tools/shared/settlements'

/**
 * Stable provider key for every row this connector writes. It is the first
 * member of the `sourceKey` tuple, so Affirm rows can never collide with
 * Shopify Payments rows on one external id.
 */
export const AFFIRM_PROVIDER_KEY = 'affirm'

/**
 * Affirm issues PRODUCTION keys only for this account — there is no sandbox
 * pair (probe §1). There is therefore no test book to distinguish, and every
 * row is `live`.
 */
const AFFIRM_ENVIRONMENT = 'live'

/**
 * The persisted cursor. `version` is checked on resume so a shape change
 * forces a fresh scan instead of being silently misread as progress.
 */
interface AffirmCursor {
  version: 1
  streamKey: string
  scanId: string
  startedAt: string
  phase: 'headers' | 'members' | 'balance'
  /** The merchant the scan started against. A change mid-scan aborts it. */
  merchantId?: string
  /** `next_page` for the outer feed (daily headers, or the standalone events feed). */
  outerCursor?: string
  /** `next_page` within the current deposit's widened member window. */
  memberCursor?: string
  pageIndex: number
  headerIndex: number
  /** The `/settlements/daily` row currently being membered. */
  summary?: AffirmSettlementSummary
  /** Its widened member window, computed once when the header was read. */
  window?: { after: string; before: string }
}

function resumeCursor(value: unknown, streamKey: string): AffirmCursor | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'object' || (value as AffirmCursor).version !== 1) {
    throw new Error('Restart the Affirm settlement scan to replace its incompatible cursor')
  }
  const cursor = value as AffirmCursor
  if (
    cursor.streamKey !== streamKey ||
    !cursor.scanId ||
    !cursor.startedAt ||
    !Number.isSafeInteger(cursor.pageIndex) ||
    cursor.pageIndex < 0 ||
    !Number.isSafeInteger(cursor.headerIndex) ||
    cursor.headerIndex < 0 ||
    !['headers', 'members', 'balance'].includes(cursor.phase)
  ) {
    throw new Error('Invalid Affirm acquisition cursor')
  }
  return cursor
}

/** Move to the next deposit header, or finish the scan. */
function continuation(cursor: AffirmCursor, outerCursor?: string): { cursor?: AffirmCursor } {
  return outerCursor
    ? {
        cursor: {
          ...cursor,
          phase: 'headers' as const,
          outerCursor,
          memberCursor: undefined,
          summary: undefined,
          window: undefined,
          pageIndex: 0,
          headerIndex: cursor.headerIndex + 1,
        },
      }
    : {}
}

/** Translate the header, keeping a rejection rather than losing the deposit. */
function headerProjection(raw: AffirmSettlementSummary) {
  try {
    return { payout: payoutEvidence(raw), rejectionReason: null }
  } catch (error) {
    return {
      payout: null,
      rejectionReason: error instanceof Error ? error.message : 'Invalid Affirm settlement',
    }
  }
}

/**
 * Affirm has no positive settlement status — a row exists because the money
 * moved, and `removal_state` appears only when it did not. So provider
 * readiness is the ABSENCE of a removal state.
 */
function providerReady(raw: AffirmSettlementSummary): boolean {
  const removal = raw.removal_state
  return !(typeof removal === 'string' && removal.trim() !== '')
}

interface ProjectedMembers {
  entries: Record<string, unknown>[]
  rejections: { index: number; raw: unknown; reason: string }[]
  rawRows: unknown[]
}

/**
 * Group one raw event page onto one deposit and translate the matches.
 *
 * Rows belonging to ANOTHER deposit are not rejections — the widened window
 * legitimately returns them, and they are the standalone stream's business.
 * They are dropped here without comment, and never recorded as this payout's
 * raw rows.
 */
function projectMembers(
  rows: AffirmSettlementEvent[],
  depositId: string,
  currency: string
): ProjectedMembers {
  const entries: Record<string, unknown>[] = []
  const rejections: { index: number; raw: unknown; reason: string }[] = []
  const rawRows: unknown[] = []
  const seen = new Map<string, string>()

  groupByDeposit(rows, depositId).forEach((raw, index) => {
    rawRows.push(raw)
    try {
      const entry = processorEvidence(raw, { currency })
      const encoded = JSON.stringify(entry)
      const previous = seen.get(entry.id)
      if (previous !== undefined && previous !== encoded) {
        throw new Error(`Settlement event ${entry.id} changed within a membership page`)
      }
      seen.set(entry.id, encoded)
      // Affirm has no counterpart to Shopify's `order_transaction` object, and
      // its `order_id` names a SHOPIFY payment session, not an Affirm object.
      // Asserting a reference into another provider's namespace here would be
      // an invention; recognition is a later, separate join (build plan §6).
      entries.push({ ...entry, sourceReference: null })
    } catch (error) {
      rejections.push({
        index,
        raw,
        reason: error instanceof Error ? error.message : 'Invalid Affirm settlement event',
      })
    }
  })

  return { entries, rejections, rawRows }
}

/** Build the payout record for one membership observation. */
function payoutRecord(
  cursor: AffirmCursor,
  merchantId: string,
  membership: Record<string, unknown>
): ConnectorRecord {
  const raw = cursor.summary as AffirmSettlementSummary
  let id: string
  try {
    id = affirmId(raw.deposit_id)
  } catch {
    // A header with no usable identity is still retained, under a scan-local
    // id, so the rejection is visible instead of the row vanishing.
    id = `rejected:${cursor.scanId}:header:${cursor.headerIndex}`
  }
  const projection = headerProjection(raw)
  return {
    streamKey: 'payout',
    externalId: id,
    displayName: `Affirm deposit ${id}`,
    fields: payoutSourceFields({
      externalId: id,
      sourceAccount: {
        providerKey: AFFIRM_PROVIDER_KEY,
        externalAccountId: merchantId,
        environment: AFFIRM_ENVIRONMENT,
      },
      acquisition: { id: `${cursor.scanId}:${id}`, startedAt: cursor.startedAt },
      // The evidence header is a closed interface; the SDK wants an open row.
      payout: projection.payout === null ? null : { ...projection.payout },
      rejectionReason: projection.rejectionReason,
      raw,
      membership: { providerReady: providerReady(raw), ...membership },
    }),
  }
}

/** The settlement currency to hand events that do not carry one. */
function settlementCurrency(raw: AffirmSettlementSummary): string | undefined {
  return typeof raw.currency === 'string' && /^[A-Za-z]{3}$/.test(raw.currency)
    ? raw.currency.toUpperCase()
    : undefined
}

/** A settlement date window, `YYYY-MM-DD`, covering the query's UTC period. */
type DateWindow = { after?: string; before?: string }

/**
 * `after` is inclusive; `before` is unproven either way, so it lands `1 + slackDays` past
 * the last date the exclusive `period.to` covers and the platform re-checks the over-read.
 */
function periodWindow(query: ConnectorQuery, slackDays = 0): DateWindow {
  const utcDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  const from = query.period?.from ? Date.parse(query.period.from) : Number.NaN
  const to = query.period?.to ? Date.parse(query.period.to) : Number.NaN
  return {
    after: Number.isFinite(from) ? utcDate(from) : undefined,
    before: Number.isFinite(to) ? utcDate(to - 1 + (1 + slackDays) * 86_400_000) : undefined,
  }
}

/** The standalone event feed — every row, including those with no `deposit_id`. */
async function fetchBalancePage(
  credentials: AffirmCredentials,
  cursor: AffirmCursor,
  dates: DateWindow
): Promise<ConnectorFetchResult> {
  // A resumed page carries its position in the provider cursor; re-sending the dates
  // alongside it would re-anchor the scan.
  const page = await fetchSettlementEvents(credentials, {
    ...(cursor.outerCursor ? {} : dates),
    limit: AFFIRM_SETTLEMENT_PAGE_LIMIT,
    page: cursor.outerCursor ?? null,
  })
  const pageId = `${cursor.scanId}:${cursor.pageIndex}`

  const records: ConnectorRecord[] = page.rows.map((raw, index) => {
    let entry: Record<string, unknown> | null = null
    let rejectionReason: string | null = null
    try {
      // `payoutId: null` is legal and expected here — build plan §3.4 rule 3.
      entry = { ...processorEvidence(raw), sourceReference: null }
    } catch (error) {
      rejectionReason = error instanceof Error ? error.message : 'Invalid Affirm settlement event'
    }
    const externalId = (entry?.id as string | undefined) ?? `rejected:${pageId}:${index}`
    return {
      streamKey: 'balance_transaction',
      externalId,
      displayName: `Affirm settlement event ${entry?.id ?? 'unresolved'}`,
      fields: processorSourceFields({
        externalId,
        sourceAccount: {
          providerKey: AFFIRM_PROVIDER_KEY,
          externalAccountId: credentials.merchantId,
          environment: AFFIRM_ENVIRONMENT,
        },
        acquisition: { id: cursor.scanId, startedAt: cursor.startedAt },
        page: { id: pageId, index: cursor.pageIndex, rowIndex: index },
        entry,
        raw,
        rejectionReason,
      }),
    }
  })

  if (page.nextPage && page.nextPage === cursor.outerCursor) {
    throw new Error('Affirm repeated a settlement event page cursor')
  }
  return page.nextPage
    ? {
        records,
        cursor: { ...cursor, outerCursor: page.nextPage, pageIndex: cursor.pageIndex + 1 },
      }
    : { records }
}

/** Read ONE deposit header and open its membership scan. */
async function fetchHeaderPage(
  credentials: AffirmCredentials,
  cursor: AffirmCursor,
  dates: DateWindow
): Promise<ConnectorFetchResult> {
  // One header per call, so a membership scan is always bounded to one deposit.
  const page = await fetchSettlements(credentials, {
    ...(cursor.outerCursor ? {} : dates),
    limit: 1,
    page: cursor.outerCursor ?? null,
  })
  if (page.rows.length > 1) {
    throw new Error('Affirm exceeded the requested settlement page size')
  }
  if (page.nextPage && page.nextPage === cursor.outerCursor) {
    throw new Error('Affirm repeated a settlement page cursor')
  }
  const raw = page.rows[0]
  if (!raw) return { records: [], ...continuation(cursor, page.nextPage ?? undefined) }

  let depositId: string | null = null
  try {
    depositId = affirmId(raw.deposit_id)
  } catch {
    depositId = null
  }
  // Grouping is on `deposit_id`, never on date equality — so the window is
  // widened on both sides and over-reading is harmless. A header that does not
  // translate has no date to widen, and gets no membership scan.
  const issuedOn = headerProjection(raw).payout?.issuedOn ?? null
  const window = issuedOn === null ? null : widenSettlementWindow(issuedOn)

  const next: AffirmCursor = {
    ...cursor,
    phase: 'members',
    summary: raw,
    window: window ?? undefined,
    outerCursor: page.nextPage ?? undefined,
    memberCursor: undefined,
    pageIndex: 0,
  }

  return {
    records: [
      payoutRecord(next, credentials.merchantId, {
        complete: false,
        page: null,
        entries: [],
        rejections: [],
        rawRows: [],
        reason:
          depositId && window
            ? 'Affirm deposit membership acquisition is pending'
            : 'Affirm settlement has no usable deposit identity or date; membership cannot be scanned',
      }),
    ],
    ...(depositId && window ? { cursor: next } : continuation(cursor, page.nextPage ?? undefined)),
  }
}

/** Page the widened window and group this deposit's members out of it. */
async function fetchMemberPage(
  credentials: AffirmCredentials,
  cursor: AffirmCursor
): Promise<ConnectorFetchResult> {
  const summary = cursor.summary
  const window = cursor.window
  if (!summary || !window) throw new Error('Affirm membership cursor has no settlement header')
  const depositId = affirmId(summary.deposit_id)

  try {
    const page = await fetchSettlementEvents(credentials, {
      after: window.after,
      before: window.before,
      limit: AFFIRM_SETTLEMENT_PAGE_LIMIT,
      page: cursor.memberCursor ?? null,
    })
    const projected = projectMembers(page.rows, depositId, settlementCurrency(summary) ?? 'USD')
    const repeated = !!page.nextPage && page.nextPage === cursor.memberCursor
    // An unfinished window is `complete: false` WITH a reason, never a short
    // answer that merely omits one — `assessPayoutMembership` reports this
    // string, and "has not completed all pages" would hide which of the three
    // ways it failed actually happened.
    const reason = repeated
      ? 'Affirm repeated a membership page cursor'
      : projected.rejections.length
        ? 'Affirm deposit membership contains rejected source rows'
        : page.nextPage
          ? 'Affirm deposit membership has more pages in its settlement window'
          : null

    return {
      records: [
        payoutRecord(cursor, credentials.merchantId, {
          // Only the last page of a fully-paged window may claim completeness,
          // and only when nothing on the way was rejected. The domain still
          // verifies the whole stored chain — this is a candidate, not a verdict.
          complete: !page.nextPage && !reason,
          reason,
          page: {
            id: `${cursor.scanId}:${depositId}:${cursor.pageIndex}`,
            index: cursor.pageIndex,
            requestCursor: cursor.memberCursor ?? null,
            nextCursor: page.nextPage ?? null,
            terminal: !page.nextPage,
          },
          ...projected,
        }),
      ],
      ...(page.nextPage && !repeated
        ? { cursor: { ...cursor, memberCursor: page.nextPage, pageIndex: cursor.pageIndex + 1 } }
        : continuation(cursor, cursor.outerCursor)),
    }
  } catch (error) {
    // A throttle is the platform's business, not a membership finding.
    if (error instanceof RateLimitError) throw error
    // Everything else is recorded as an INCOMPLETE membership with its reason,
    // so the deposit is visible and un-postable rather than absent or short.
    return {
      records: [
        payoutRecord(cursor, credentials.merchantId, {
          complete: false,
          page: null,
          entries: [],
          rejections: [],
          rawRows: [],
          reason:
            error instanceof Error ? error.message : 'Affirm deposit membership is unavailable',
        }),
      ],
      ...continuation(cursor, cursor.outerCursor),
    }
  }
}

/**
 * Fetch one bounded source page. The platform owns cursor persistence and the
 * continuation loop.
 */
export async function fetchAffirmStream(args: ConnectorExecuteArgs): Promise<ConnectorFetchResult> {
  // A connector receives its bound connection EXPLICITLY. `getConnection()`
  // resolves a tool context and is not the connector contract.
  const credentials = affirmCredentialsFrom(args.connection?.fields)
  const cursor = resumeCursor(args.cursor, args.streamKey)
  // An event's `transactionDate` (the period path) can precede its settlement `date`, which
  // is what the feed filters on, so its upper bound gets the member window's slack.
  const dates =
    args.streamKey === 'payout'
      ? periodWindow(args.query)
      : periodWindow(args.query, AFFIRM_MEMBER_WINDOW_DAYS)

  // Commit the acquisition identity BEFORE reading any financial fact. Retries
  // reuse the same identity; `startedAt` is diagnostic, never a provider version.
  if (!cursor) {
    return {
      records: [],
      cursor: {
        version: 1,
        streamKey: args.streamKey,
        scanId: crypto.randomUUID(),
        startedAt: new Date().toISOString(),
        phase: args.streamKey === 'payout' ? 'headers' : 'balance',
        merchantId: credentials.merchantId,
        pageIndex: 0,
        headerIndex: 0,
      } satisfies AffirmCursor,
    }
  }

  if (cursor.merchantId && cursor.merchantId !== credentials.merchantId) {
    throw new Error('The Affirm merchant changed during acquisition; restart the scan')
  }
  const bound: AffirmCursor = { ...cursor, merchantId: credentials.merchantId }

  try {
    if (bound.phase === 'balance') return await fetchBalancePage(credentials, bound, dates)
    if (bound.phase === 'headers') return await fetchHeaderPage(credentials, bound, dates)
    return await fetchMemberPage(credentials, bound)
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Never sleep. The platform re-invokes with this same cursor after the wait.
      return {
        records: [],
        rateLimited: {
          retryAfterMs:
            error.retryAfterSeconds === undefined ? undefined : error.retryAfterSeconds * 1000,
        },
      }
    }
    throw error
  }
}

export default fetchAffirmStream
