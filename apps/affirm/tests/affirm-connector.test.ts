// tests/affirm-connector.test.ts
//
// The connector's five load-bearing behaviours, each of which is a way a
// settlement feed can quietly lie:
//
//   1. cursor resume        — a resumed page must not re-apply the start date
//   2. widened-window group — a member dated a day off its deposit must still
//                             be collected, because grouping is on deposit_id
//   3. partial membership   — an unfinished window is `complete: false` WITH a
//                             reason; a short answer is how a deposit posts short
//   4. no deposit_id        — a standalone event is real, and `payoutId: null`
//                             is legal, not a rejection
//   5. 429                  — return `rateLimited` with the SAME cursor; never
//                             sleep, never advance past an unread page
//
// Fixtures are VERBATIM public-API rows from the 2026-09-16 probe — the real
// 2026-09-15 deposit `I5Y8PHAWWSSS2WJ` ($3,579.30) and one member of the real
// multi-event deposit `3KIMO82WVXDZ6J9` — unless marked SYNTHETIC.
//
// The envelope key is `data` on both endpoints, which is what the API reference
// calls it; the merchant portal says `settlements` / `events`, and the tolerant
// reader still accepts those. Both are pinned below.

import type { ConnectorQuery } from '@auxx/sdk/data-connectors'
import { beforeEach, describe, expect, it } from 'vitest'
import { fetchAffirmStream } from '../src/affirm.connector.server'

// ---------------------------------------------------------------------------
// A stubbed Affirm
// ---------------------------------------------------------------------------

let requests: URL[] = []
let responses: Response[] = []

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

beforeEach(() => {
  requests = []
  responses = []
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requests.push(new URL(String(input)))
    const next = responses.shift()
    if (!next) throw new Error(`Unexpected Affirm request: ${String(input)}`)
    return next
  }) as typeof fetch
})

const MERCHANT_ID = '07JVNWWI5PZM8L7Y'
const DEPOSIT_ID = 'I5Y8PHAWWSSS2WJ'

const CONNECTION = {
  value: '',
  fields: { merchant_id: MERCHANT_ID, public_key: 'pub', private_key: 'priv' },
}

const MEMBER_EVENT_ID = '53f9cad7-b293-4918-b7d4-6716c64e21de'

/** ✔ REAL. `GET /settlements/daily`, the Sep-15 deposit, verbatim. */
const SUMMARY = {
  total_settled: 357930,
  currency: 'USD',
  total_fees: -16075,
  date: '2026-09-15',
  account_last_four: '6670',
  total_refunds: 0,
  total_sales: 374005,
  deposit_id: DEPOSIT_ID,
  id: 'a28fbb9b-2f7c-4880-a938-3ed6d32709d8',
}

/**
 * ✔ REAL. `GET /settlements/events`, the one member of that deposit, verbatim.
 *
 * Note its `effective_date`: `2026-09-14T19:28:14Z`, the day BEFORE the
 * settlement `date` of `2026-09-15`. That divergence is not a contrivance, it
 * is what the live row says, and it is the whole point of the widened window —
 * a scan that grouped on date equality would drop rows like this and post the
 * deposit short. (The real Sep-03 deposit below is the same story: three
 * captures effective 2026-09-02, settled 2026-09-03.)
 *
 * ⚠️ `fees: -16075` is the WHOLE fee; `transaction_fees: -30` is a component OF
 * it. `374005 + -16075 = 357930`, exactly.
 */
const MEMBER_EVENT = {
  order_id: 'rPhjzMna9vESRYlOF0hLADbBL',
  merchant_id: MERCHANT_ID,
  channel: 'Affirm Direct',
  deposit_id: DEPOSIT_ID,
  initiating_merchant_id: MERCHANT_ID,
  mdr: 0.0429,
  date: '2026-09-15',
  total_settled: 357930,
  effective_date: '2026-09-14T19:28:14Z',
  id: MEMBER_EVENT_ID,
  transaction_id: 'oTzSBZG2TU5WGc28',
  event_type: 'loan_capture',
  transaction_fees: -30,
  original_loan_amount: 374005,
  sales: 374005,
  charge_created_date: '2026-09-14',
  refunds: 0,
  transaction_event_id: 'DUUX0OUUPNABFT9G',
  fees: -16075,
  purchase_id: 'CPDZ-ANRU',
  currency: 'USD',
}

/**
 * ✔ REAL. A member of the OTHER real deposit, `3KIMO82WVXDZ6J9`, verbatim —
 * the kind of neighbouring row the widened window legitimately returns and the
 * local grouping must ignore.
 */
const OTHER_DEPOSIT_EVENT = {
  order_id: 'rauWYononuS2HihiLhrBS7i8V',
  merchant_id: MERCHANT_ID,
  channel: 'Affirm Direct',
  deposit_id: '3KIMO82WVXDZ6J9',
  initiating_merchant_id: MERCHANT_ID,
  mdr: 0.0429,
  date: '2026-09-03',
  total_settled: 336619,
  effective_date: '2026-09-02T01:35:46Z',
  id: 'be142842-bfec-41c0-9095-b5442dd02137',
  transaction_id: 'R8LaQM01oa5ow8XO',
  event_type: 'loan_capture',
  transaction_fees: -30,
  original_loan_amount: 351739,
  sales: 351739,
  charge_created_date: '2026-09-02',
  refunds: 0,
  transaction_event_id: 'YWWC2HWEY94W6ZCS',
  fees: -15120,
  purchase_id: '5IHA-T2T3',
  currency: 'USD',
}

/**
 * SYNTHETIC: every one of the nine live events carried a `deposit_id`. The
 * shape is still required by the plan — an event belonging to no deposit — so
 * the fixture stays, consistent with the real arithmetic.
 */
const UNASSIGNED_EVENT = {
  id: 'VCNADJ00000000AA',
  date: '2026-09-15',
  effective_date: '2026-09-15T08:12:03Z',
  event_type: 'vcn_balance_adjustment',
  sales: 0,
  refunds: 0,
  fees: -500,
  transaction_fees: 0,
  total_settled: -500,
  currency: 'USD',
}

interface Cursor {
  phase: string
  scanId: string
  pageIndex: number
  headerIndex: number
  outerCursor?: string
  memberCursor?: string
  window?: { after: string; before: string }
  summary?: Record<string, unknown>
}

function run(streamKey: string, state: { cursor?: unknown }, query: ConnectorQuery = {}) {
  return fetchAffirmStream({
    streamKey,
    query,
    cursor: state.cursor,
    connection: CONNECTION,
    config: {},
  })
}

const asRecords = (result: { records: unknown }) =>
  result.records as { fields: Record<string, any> }[]

// ---------------------------------------------------------------------------

describe('acquisition identity', () => {
  it('commits a cursor before reading any financial fact', async () => {
    const result = await run('payout', {})

    expect(result.records).toEqual([])
    // Nothing was fetched: the acquisition identity is persisted first, so a
    // retry reuses it rather than minting a second one over the same money.
    expect(requests).toHaveLength(0)
    const cursor = result.cursor as Cursor
    expect(cursor.phase).toBe('headers')
    expect(cursor.scanId).toBeTruthy()
  })

  it('opens the balance_transaction stream in its own phase', async () => {
    const result = await run('balance_transaction', {})
    expect((result.cursor as Cursor).phase).toBe('balance')
  })

  it('refuses a cursor from another stream rather than reading it as progress', async () => {
    await expect(
      run('payout', { cursor: { version: 1, streamKey: 'balance_transaction' } })
    ).rejects.toThrow(/Invalid Affirm acquisition cursor/)
  })
})

describe('headers phase', () => {
  it('reads one deposit, widens its window, and reports membership as pending', async () => {
    responses.push(jsonResponse({ data: [SUMMARY], next_page: null }))
    const open = await run('payout', {})

    const result = await run('payout', { cursor: open.cursor }, {})
    const [record] = asRecords(result)

    expect(record!.fields.externalId).toBe(DEPOSIT_ID)
    expect(record!.fields.amount).toBe('3579.30')
    expect(record!.fields.issuedOn).toBe('2026-09-15')
    // Pending is stated, not implied by an empty entry list.
    expect(record!.fields.membership.complete).toBe(false)
    expect(record!.fields.membership.reason).toMatch(/pending/i)
    expect(record!.fields.membership.entries).toEqual([])
    expect(record!.fields.processorTransactions).toEqual([])

    const cursor = result.cursor as Cursor
    expect(cursor.phase).toBe('members')
    // A day either side of the settlement date. Build plan §3.4 rule 2.
    expect(cursor.window).toEqual({ after: '2026-09-14', before: '2026-09-16' })
  })

  it('applies the period floor, then does NOT re-apply it on a resumed page', async () => {
    const query = { period: { from: '2026-09-01T00:00:00.000Z' } }
    responses.push(jsonResponse({ data: [SUMMARY], next_page: 'from_cursor_uuid=abc' }))
    const open = await run('payout', {}, query)
    await run('payout', { cursor: open.cursor }, query)

    expect(requests[0]!.searchParams.get('after')).toBe('2026-09-01')
    expect(requests[0]!.searchParams.get('before')).toBeNull()
    expect(requests[0]!.searchParams.get('merchant_id')).toBe(MERCHANT_ID)

    // Resume: the provider's own cursor carries the position, and re-sending
    // the start date alongside it would re-anchor the scan to the beginning.
    responses.push(jsonResponse({ data: [], next_page: null }))
    const resumed = {
      ...(open.cursor as Cursor),
      outerCursor: 'from_cursor_uuid=abc',
      headerIndex: 1,
    }
    await run('payout', { cursor: resumed }, query)

    expect(requests[1]!.searchParams.get('after')).toBeNull()
    expect(requests[1]!.searchParams.get('from_cursor_uuid')).toBe('abc')
  })

  it('reads a closed period through the day its exclusive end covers', async () => {
    responses.push(jsonResponse({ data: [], next_page: null }))
    const query = {
      period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
    }
    const open = await run('payout', {}, query)
    await run('payout', { cursor: open.cursor }, query)

    expect(requests[0]!.searchParams.get('after')).toBe('2026-08-01')
    // `to` is exclusive and Affirm's `before` is unproven: read through Aug 31 either way.
    expect(requests[0]!.searchParams.get('before')).toBe('2026-09-01')
  })

  it('widens a balance period end by the member window, since events predate settlement', async () => {
    responses.push(jsonResponse({ data: [], next_page: null }))
    const query = { period: { to: '2026-09-01T00:00:00.000Z' } }
    const open = await run('balance_transaction', {}, query)
    await run('balance_transaction', { cursor: open.cursor }, query)

    expect(requests[0]!.searchParams.get('after')).toBeNull()
    expect(requests[0]!.searchParams.get('before')).toBe('2026-09-02')
  })
})

describe('the response envelope', () => {
  // ✔ The collection key is `data` on BOTH endpoints — the name Affirm's own
  // API reference uses — observed live on 2026-09-16. The merchant portal calls
  // the same collections `settlements` and `events`, which is exactly why the
  // reader is tolerant rather than pinned to one name. Every other fixture in
  // this file now uses `data`; these three make the rule explicit.

  const balanceCursor = {
    version: 1,
    streamKey: 'balance_transaction',
    scanId: 'scan',
    startedAt: '2026-09-15T00:00:00Z',
    phase: 'balance',
    merchantId: MERCHANT_ID,
    pageIndex: 0,
    headerIndex: 0,
  }

  it('reads /settlements/daily rows out of `data`', async () => {
    responses.push(jsonResponse({ data: [SUMMARY], next_page: null }))
    const open = await run('payout', {})

    const result = await run('payout', { cursor: open.cursor })
    expect(requests[0]!.pathname).toMatch(/\/settlements\/daily$/)
    expect(asRecords(result)[0]!.fields.externalId).toBe(DEPOSIT_ID)
    expect(asRecords(result)[0]!.fields.amount).toBe('3579.30')
    expect((result.cursor as Cursor).phase).toBe('members')
  })

  it('reads /settlements/events rows out of `data`', async () => {
    responses.push(jsonResponse({ data: [MEMBER_EVENT], next_page: null }))

    const result = await run('balance_transaction', { cursor: balanceCursor })
    expect(requests[0]!.pathname).toMatch(/\/settlements\/events$/)
    expect(asRecords(result)).toHaveLength(1)
    expect(asRecords(result)[0]!.fields.externalId).toBe(MEMBER_EVENT_ID)
    expect(asRecords(result)[0]!.fields.rejectionReason).toBeNull()
  })

  it('still accepts the portal’s `settlements` and `events` names', async () => {
    responses.push(jsonResponse({ settlements: [SUMMARY], next_page: null }))
    const open = await run('payout', {})
    const header = await run('payout', { cursor: open.cursor })
    expect(asRecords(header)[0]!.fields.externalId).toBe(DEPOSIT_ID)

    responses.push(jsonResponse({ events: [MEMBER_EVENT], next_page: null }))
    const events = await run('balance_transaction', { cursor: balanceCursor })
    expect(asRecords(events)[0]!.fields.externalId).toBe(MEMBER_EVENT_ID)
  })

  it('refuses a body with no collection at all rather than reporting an empty page', async () => {
    responses.push(jsonResponse({ next_page: null }))
    const open = await run('payout', {})
    await expect(run('payout', { cursor: open.cursor })).rejects.toThrow(/no rows/i)
  })
})

describe('membership — the widened window, grouped locally', () => {
  const membersCursor = (over: Partial<Cursor> = {}) => ({
    version: 1,
    streamKey: 'payout',
    scanId: 'scan',
    startedAt: '2026-09-15T00:00:00Z',
    phase: 'members',
    merchantId: MERCHANT_ID,
    pageIndex: 0,
    headerIndex: 0,
    summary: SUMMARY,
    window: { after: '2026-09-14', before: '2026-09-16' },
    ...over,
  })

  it('collects a member effective outside the settlement date and ignores another deposit', async () => {
    responses.push(
      jsonResponse({
        events: [OTHER_DEPOSIT_EVENT, MEMBER_EVENT, UNASSIGNED_EVENT],
        next_page: null,
      })
    )

    const result = await run('payout', { cursor: membersCursor() })
    const [record] = asRecords(result)
    const membership = record!.fields.membership

    // Affirm has NO deposit_id filter, so the request is a date window...
    expect(requests[0]!.pathname).toMatch(/\/settlements\/events$/)
    expect(requests[0]!.searchParams.get('after')).toBe('2026-09-14')
    expect(requests[0]!.searchParams.get('before')).toBe('2026-09-16')
    expect(requests[0]!.searchParams.get('deposit_id')).toBeNull()

    // ...and the grouping is local, on deposit_id and never on date equality.
    expect(membership.entries).toHaveLength(1)
    expect(membership.entries[0].id).toBe(MEMBER_EVENT_ID)
    expect(membership.entries[0].payoutId).toBe(DEPOSIT_ID)
    // The entry is dated by its own `effective_date`, not by the deposit's
    // date-only settlement date — which stays on the header's `issuedOn`.
    expect(membership.entries[0].transactionDate).toBe('2026-09-14T19:28:14Z')
    // The other deposit's row and the unassigned row are not this payout's raw
    // rows, and are not rejections either.
    expect(membership.rawRows).toEqual([MEMBER_EVENT])
    expect(membership.rejections).toEqual([])

    // The arithmetic the platform will check: fee POSITIVE, gross - fee = net.
    // fee = -(-16075). The row's `transaction_fees: -30` is a component OF that
    // fee and is NOT added — adding it would give 161.05 and 3740.35.
    expect(membership.entries[0].fee).toBe('160.75')
    expect(membership.entries[0].gross).toBe('3740.05')
    expect(membership.entries[0].net).toBe('3579.30')

    expect(membership.complete).toBe(true)
    expect(membership.reason).toBeNull()
    expect(result.cursor).toBeUndefined()

    // The child rows the connector fans onto processor_balance_entry.
    expect(record!.fields.processorTransactions).toHaveLength(1)
    expect(record!.fields.processorTransactions[0].providerType).toBe('loan_capture')
  })

  it('is incomplete WITH a reason while the window has unread pages', async () => {
    responses.push(jsonResponse({ data: [MEMBER_EVENT], next_page: 'to_cursor_uuid=next' }))

    const result = await run('payout', { cursor: membersCursor() })
    const membership = asRecords(result)[0]!.fields.membership

    expect(membership.complete).toBe(false)
    expect(membership.reason).toMatch(/more pages/i)
    expect(membership.page).toMatchObject({ terminal: false, nextCursor: 'to_cursor_uuid=next' })
    // The entries seen so far are still emitted — incomplete, not discarded.
    expect(membership.entries).toHaveLength(1)
    expect((result.cursor as Cursor).memberCursor).toBe('to_cursor_uuid=next')
    expect((result.cursor as Cursor).pageIndex).toBe(1)
  })

  it('refuses to treat a repeated page cursor as progress', async () => {
    responses.push(jsonResponse({ data: [MEMBER_EVENT], next_page: 'stuck' }))

    const result = await run('payout', { cursor: membersCursor({ memberCursor: 'stuck' }) })
    const membership = asRecords(result)[0]!.fields.membership

    expect(membership.complete).toBe(false)
    expect(membership.reason).toMatch(/repeated a membership page cursor/i)
    expect(result.cursor).toBeUndefined()
  })

  it('records a failed membership read as incomplete rather than losing the deposit', async () => {
    responses.push(jsonResponse({ message: 'Affirm is unwell' }, 500))

    const result = await run('payout', { cursor: membersCursor() })
    const membership = asRecords(result)[0]!.fields.membership

    expect(membership.complete).toBe(false)
    expect(membership.reason).toBeTruthy()
    // The header survives with its amount, so the deposit is visible and
    // un-postable instead of absent.
    expect(asRecords(result)[0]!.fields.amount).toBe('3579.30')
  })

  it('keeps an unmappable event type as a rejection, not as a silent omission', async () => {
    // SYNTHETIC: a row with no event_type at all, which cannot be translated.
    responses.push(jsonResponse({ data: [{ ...MEMBER_EVENT, event_type: '' }], next_page: null }))

    const membership = asRecords(await run('payout', { cursor: membersCursor() }))[0]!.fields
      .membership
    expect(membership.entries).toEqual([])
    expect(membership.rejections).toHaveLength(1)
    expect(membership.complete).toBe(false)
    expect(membership.reason).toMatch(/rejected source rows/i)
  })
})

describe('balance_transaction — the standalone feed', () => {
  const balanceCursor = (over: Partial<Cursor> = {}) => ({
    version: 1,
    streamKey: 'balance_transaction',
    scanId: 'scan',
    startedAt: '2026-09-15T00:00:00Z',
    phase: 'balance',
    merchantId: MERCHANT_ID,
    pageIndex: 0,
    headerIndex: 0,
    ...over,
  })

  it('emits an event with no deposit_id, with payoutId null', async () => {
    responses.push(jsonResponse({ data: [UNASSIGNED_EVENT, MEMBER_EVENT], next_page: null }))

    const result = await run('balance_transaction', { cursor: balanceCursor() })
    const records = asRecords(result)

    expect(records).toHaveLength(2)
    // `payoutId: null` is legal and expected — build plan §3.4 rule 3.
    expect(records[0]!.fields.payoutId).toBeNull()
    expect(records[0]!.fields.externalId).toBe('VCNADJ00000000AA')
    expect(records[0]!.fields.type).toBe('adjustment')
    expect(records[0]!.fields.rejectionReason).toBeNull()
    // The same row that belongs to a deposit is emitted here too, carrying it.
    expect(records[1]!.fields.payoutId).toBe(DEPOSIT_ID)
    expect(result.cursor).toBeUndefined()
  })

  it('retains an unreadable row under a scan-local id instead of dropping it', async () => {
    responses.push(jsonResponse({ data: [{ id: 'X', total_settled: 1 }], next_page: null }))

    const [record] = asRecords(await run('balance_transaction', { cursor: balanceCursor() }))
    expect(record!.fields.externalId).toMatch(/^rejected:scan:0:0$/)
    expect(record!.fields.rejectionReason).toMatch(/event type/i)
  })

  it('advances its page cursor and stops on a repeat', async () => {
    responses.push(jsonResponse({ data: [], next_page: 'page2' }))
    const first = await run('balance_transaction', { cursor: balanceCursor() })
    expect((first.cursor as Cursor).outerCursor).toBe('page2')
    expect((first.cursor as Cursor).pageIndex).toBe(1)

    responses.push(jsonResponse({ data: [], next_page: 'page2' }))
    await expect(
      run('balance_transaction', { cursor: balanceCursor({ outerCursor: 'page2' }) })
    ).rejects.toThrow(/repeated a settlement event page cursor/i)
  })
})

describe('429', () => {
  it('returns rateLimited with the SAME cursor and never sleeps', async () => {
    responses.push(jsonResponse({ message: 'slow down' }, 429, { 'retry-after': '30' }))

    const cursor = {
      version: 1,
      streamKey: 'balance_transaction',
      scanId: 'scan',
      startedAt: '2026-09-15T00:00:00Z',
      phase: 'balance',
      merchantId: MERCHANT_ID,
      pageIndex: 3,
      headerIndex: 0,
      outerCursor: 'page4',
    }
    const started = Date.now()
    const result = await run('balance_transaction', { cursor })

    expect(result.records).toEqual([])
    expect(result.rateLimited).toEqual({ retryAfterMs: 30_000 })
    // No cursor and no `since`: the platform retries the SAME page, and no marker
    // moves past a page that was never read.
    expect(result.cursor).toBeUndefined()
    expect(result.since).toBeUndefined()
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('surfaces a throttle from the membership phase too, without inventing a membership', async () => {
    responses.push(jsonResponse({}, 429))

    const cursor = {
      version: 1,
      streamKey: 'payout',
      scanId: 'scan',
      startedAt: '2026-09-15T00:00:00Z',
      phase: 'members',
      merchantId: MERCHANT_ID,
      pageIndex: 0,
      headerIndex: 0,
      summary: SUMMARY,
      window: { after: '2026-09-14', before: '2026-09-16' },
    }
    const result = await run('payout', { cursor })

    expect(result.records).toEqual([])
    // A missing Retry-After must not become 0 — that reads as "retry now".
    expect(result.rateLimited).toEqual({ retryAfterMs: undefined })
    expect(result.cursor).toBeUndefined()
  })
})

describe('connection', () => {
  it('refuses to sync without all three connection fields', async () => {
    await expect(
      fetchAffirmStream({
        streamKey: 'payout',
        query: {},
        connection: { value: '', fields: { merchant_id: MERCHANT_ID } },
        config: {},
      })
    ).rejects.toThrow(/not connected/i)
  })

  it('aborts a scan whose merchant changed underneath it', async () => {
    await expect(
      run('payout', {
        cursor: {
          version: 1,
          streamKey: 'payout',
          scanId: 'scan',
          startedAt: '2026-09-15T00:00:00Z',
          phase: 'headers',
          merchantId: 'SOMEONEELSE00000',
          pageIndex: 0,
          headerIndex: 0,
        },
      })
    ).rejects.toThrow(/merchant changed/i)
  })
})
