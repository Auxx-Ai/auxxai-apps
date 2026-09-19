// tests/authorize-net-connector.test.ts
//
// `offset` is 1-based; every fixture is synthetic, since no live probe has run
// (see `ASSUMPTIONS.md`).

import { beforeEach, describe, expect, it } from 'vitest'
import { fetchAuthorizeNetStream } from '../src/authorize-net.connector.server'

let requests: { request: string; body: Record<string, any> }[] = []
let responses: Response[] = []

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

/** The gateway serves its JSON with a UTF-8 BOM that `JSON.parse` rejects. */
function bomResponse(body: unknown): Response {
  return new Response(`﻿${JSON.stringify(body)}`, {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

const OK = { resultCode: 'Ok', message: [{ code: 'I00001', text: 'Successful.' }] }

beforeEach(() => {
  requests = []
  responses = []
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const payload = JSON.parse(String(init?.body ?? '{}')) as Record<string, any>
    const request = Object.keys(payload)[0]!
    requests.push({ request, body: payload[request] })
    const next = responses.shift()
    if (!next) throw new Error(`Unexpected Authorize.net request: ${request}`)
    return next
  }) as typeof fetch

  // Every scan opens with the identity call.
  responses.push(
    jsonResponse({
      gatewayId: '565697',
      merchantName: 'Auxx Lift',
      currencies: ['USD'],
      messages: OK,
    })
  )
})

const CONNECTION = {
  value: '',
  fields: { api_login_id: '5KP3u95bQpv', transaction_key: '346HZ32z3fP4hTG2', environment: 'live' },
}

const CONFIG = { settlementHistoryStartDate: '2026-01-01' }

interface Cursor {
  phase: string
  scanId: string
  accountId: string
  environment: string
  currency?: string
  windowIndex: number
  batchIndex: number
  offset: number
  pageIndex: number
  batches?: { batchId: string }[]
}

function run(state: Record<string, unknown>, config: object = CONFIG) {
  return fetchAuthorizeNetStream({
    streamKey: 'payout',
    mode: 'incremental',
    state,
    connection: CONNECTION,
    config,
  } as any)
}

const asRecords = (result: { records: unknown }) =>
  result.records as { externalId: string; fields: Record<string, any> }[]

const batch = (batchId: string, chargeAmount: string) => ({
  batchId,
  settlementTimeUTC: '2026-01-05T18:48:19Z',
  settlementState: 'settledSuccessfully',
  statistics: [
    {
      accountType: 'Visa',
      chargeAmount,
      chargeCount: 1,
      refundAmount: '0.00',
      refundCount: 0,
      voidCount: 0,
      declineCount: 0,
      errorCount: 0,
    },
  ],
})

const transaction = (transId: string, settleAmount = '1.00') => ({
  transId,
  submitTimeUTC: '2026-01-05T09:00:00Z',
  transactionStatus: 'settledSuccessfully',
  accountType: 'Visa',
  amount: settleAmount,
  settleAmount,
  invoiceNumber: '3754',
})

const page = (count: number, start: number) =>
  Array.from({ length: count }, (_, index) => transaction(String(start + index)))

/** Open a scan and walk it to the point where batch `10198080` is being membered. */
async function openMembership() {
  const opened = await run({})
  responses.push(jsonResponse({ batchList: [batch('10198080', '2.00')], messages: OK }))
  const headers = await run({ cursor: opened.nextState.cursor })
  return headers.nextState.cursor as Cursor
}

// ---------------------------------------------------------------------------

describe('acquisition identity', () => {
  it('resolves the gateway id and the currency before any settlement is read', async () => {
    const result = await run({})

    expect(result.records).toEqual([])
    expect(requests.map((entry) => entry.request)).toEqual(['getMerchantDetailsRequest'])
    const cursor = result.nextState.cursor as Cursor
    expect(cursor.phase).toBe('headers')
    expect(cursor.accountId).toBe('565697')
    expect(cursor.currency).toBe('USD')
    expect(cursor.environment).toBe('live')
    expect(cursor.offset).toBe(1)
  })

  it('falls back to the API Login ID when the gateway names no id', async () => {
    responses = [jsonResponse({ merchantName: 'Auxx Lift', messages: OK })]
    const cursor = (await run({})).nextState.cursor as Cursor
    expect(cursor.accountId).toBe('5KP3u95bQpv')
    expect(cursor.currency).toBeUndefined()
  })

  it('falls back when the identity call itself is refused', async () => {
    responses = [
      jsonResponse({
        messages: { resultCode: 'Error', message: [{ code: 'E00011', text: 'Access denied.' }] },
      }),
    ]
    expect(((await run({})).nextState.cursor as Cursor).accountId).toBe('5KP3u95bQpv')
  })

  it('refuses a connection with no credentials', async () => {
    await expect(
      fetchAuthorizeNetStream({
        streamKey: 'payout',
        mode: 'incremental',
        state: {},
        connection: { value: '', fields: {} },
        config: CONFIG,
      } as any)
    ).rejects.toThrow(/not connected/i)
  })
})

describe('window paging', () => {
  it('asks for at most 31 days and walks forward on resume', async () => {
    const opened = await run({})
    responses.push(jsonResponse({ batchList: [], messages: OK }))
    const first = await run({ cursor: opened.nextState.cursor })

    const firstCall = requests[1]!
    expect(firstCall.request).toBe('getSettledBatchListRequest')
    expect(firstCall.body.firstSettlementDate).toBe('2026-01-01T00:00:00Z')
    expect(firstCall.body.lastSettlementDate).toBe('2026-01-31T23:59:59Z')
    expect(firstCall.body.includeStatistics).toBe(true)

    // An empty window is not the end of the scan; the cursor moves to the next.
    expect(first.records).toEqual([])
    expect((first.nextState.cursor as Cursor).windowIndex).toBe(1)

    responses.push(jsonResponse({ batchList: [], messages: OK }))
    await run({ cursor: first.nextState.cursor })
    expect(requests[2]!.body.firstSettlementDate).toBe('2026-02-01T00:00:00Z')
    expect(requests[2]!.body.lastSettlementDate).toBe('2026-03-03T23:59:59Z')
  })

  it('finishes the backfill once the windows run out', async () => {
    const opened = await run({})
    const cursor = { ...(opened.nextState.cursor as Cursor), windowIndex: 9999 }
    const result = await run({ cursor })
    expect(result.nextState).toEqual({ backfillComplete: true })
  })

  it('parses a BOM-prefixed body', async () => {
    const opened = await run({})
    responses.push(bomResponse({ batchList: [batch('10198080', '2.00')], messages: OK }))
    const result = await run({ cursor: opened.nextState.cursor })
    const cursor = result.nextState.cursor as Cursor
    expect(cursor.phase).toBe('members')
    expect(cursor.batches?.[0]?.batchId).toBe('10198080')
  })

  it('surfaces an Error result code with its own code', async () => {
    const opened = await run({})
    responses.push(
      jsonResponse({
        messages: {
          resultCode: 'Error',
          message: [{ code: 'E00003', text: 'The element is invalid.' }],
        },
      })
    )
    await expect(run({ cursor: opened.nextState.cursor })).rejects.toThrow(/E00003/)
  })
})

describe('member paging', () => {
  it('sends a 1-based offset and ends on totalNumInResultSet across two pages', async () => {
    const cursor = await openMembership()

    responses.push(
      jsonResponse({ transactions: page(250, 1), totalNumInResultSet: 260, messages: OK })
    )
    const firstPage = await run({ cursor })
    expect(requests[2]!.body.batchId).toBe('10198080')
    expect(requests[2]!.body.paging).toEqual({ limit: '250', offset: '1' })

    const firstMembership = asRecords(firstPage)[0]!.fields.membership
    expect(firstMembership.complete).toBe(false)
    expect(firstMembership.reason).toMatch(/more transaction pages/)
    expect(firstMembership.entries).toHaveLength(250)
    const resumed = firstPage.nextState.cursor as Cursor
    expect(resumed.offset).toBe(251)

    responses.push(
      jsonResponse({ transactions: page(10, 251), totalNumInResultSet: 260, messages: OK })
    )
    const lastPage = await run({ cursor: resumed })
    expect(requests[3]!.body.paging).toEqual({ limit: '250', offset: '251' })
    const lastMembership = asRecords(lastPage)[0]!.fields.membership
    expect(lastMembership.complete).toBe(true)
    expect(lastMembership.reason).toBeNull()
    expect(lastMembership.page.terminal).toBe(true)
    // The window held one batch, so the scan returns to the header phase.
    expect((lastPage.nextState.cursor as Cursor).phase).toBe('headers')
    expect((lastPage.nextState.cursor as Cursor).windowIndex).toBe(1)
  })

  it('terminates on a short page even when the total disagrees', async () => {
    const cursor = await openMembership()
    responses.push(
      jsonResponse({ transactions: page(3, 1), totalNumInResultSet: 900, messages: OK })
    )
    const result = await run({ cursor })

    const membership = asRecords(result)[0]!.fields.membership
    expect(membership.complete).toBe(true)
    expect(membership.entries).toHaveLength(3)
    expect((result.nextState.cursor as Cursor).phase).toBe('headers')
  })

  it('treats a page that delivers nothing while claiming more as a fault', async () => {
    const cursor = await openMembership()
    responses.push(jsonResponse({ transactions: [], totalNumInResultSet: 900, messages: OK }))
    const result = await run({ cursor })

    const membership = asRecords(result)[0]!.fields.membership
    expect(membership.complete).toBe(false)
    expect(membership.reason).toMatch(/reports more/)
    // And it moves on rather than re-asking for the same offset forever.
    expect((result.nextState.cursor as Cursor).phase).toBe('headers')
  })

  it('records an unavailable membership rather than dropping the batch', async () => {
    const cursor = await openMembership()
    responses.push(
      jsonResponse({
        messages: { resultCode: 'Error', message: [{ code: 'E00040', text: 'Not found.' }] },
      })
    )
    const result = await run({ cursor })

    const record = asRecords(result)[0]!
    expect(record.externalId).toBe('10198080')
    expect(record.fields.membership.complete).toBe(false)
    expect(record.fields.membership.reason).toMatch(/E00040/)
    expect(record.fields.amount).toBe('2.00')
  })

  it('omits voids and declines from membership but keeps them in the raw rows', async () => {
    const cursor = await openMembership()
    responses.push(
      jsonResponse({
        transactions: [
          transaction('60000001', '2.00'),
          { ...transaction('60000002', '5.00'), transactionStatus: 'voided' },
          { ...transaction('60000003', '7.00'), transactionStatus: 'declined' },
        ],
        totalNumInResultSet: 3,
        messages: OK,
      })
    )
    const membership = asRecords(await run({ cursor }))[0]!.fields.membership
    expect(membership.entries).toHaveLength(1)
    expect(membership.rawRows).toHaveLength(3)
    expect(membership.complete).toBe(true)
    expect(membership.providerReady).toBe(true)
  })

  it('walks a second batch in the same window before the next window', async () => {
    const opened = await run({})
    responses.push(
      jsonResponse({
        batchList: [batch('10198080', '2.00'), batch('10198081', '3.00')],
        messages: OK,
      })
    )
    const headers = await run({ cursor: opened.nextState.cursor })

    responses.push(jsonResponse({ transactions: page(1, 1), totalNumInResultSet: 1, messages: OK }))
    const first = await run({ cursor: headers.nextState.cursor })
    expect(asRecords(first)[0]!.externalId).toBe('10198080')
    const next = first.nextState.cursor as Cursor
    expect(next.phase).toBe('members')
    expect(next.batchIndex).toBe(1)
    expect(next.offset).toBe(1)

    responses.push(jsonResponse({ transactions: page(1, 2), totalNumInResultSet: 1, messages: OK }))
    const second = await run({ cursor: next })
    expect(asRecords(second)[0]!.externalId).toBe('10198081')
    expect((second.nextState.cursor as Cursor).phase).toBe('headers')
  })
})

describe('throttling', () => {
  it('returns rateLimited with the SAME cursor and reads nothing more', async () => {
    const cursor = await openMembership()
    responses.push(jsonResponse({}, 429, { 'retry-after': '30' }))
    const result = await run({ cursor })

    expect(result.records).toEqual([])
    expect(result.nextState).toEqual({ cursor })
    expect(result.rateLimited).toEqual({ retryAfterMs: 30_000 })
  })

  it('never reports a retry delay it was not given', async () => {
    const opened = await run({})
    responses.push(jsonResponse({}, 429))
    const result = await run({ cursor: opened.nextState.cursor })
    expect(result.rateLimited).toEqual({ retryAfterMs: undefined })
  })
})

describe('identity', () => {
  it('emits the same sourceKeys on a second pass over the same batch', async () => {
    const keys = async () => {
      requests = []
      responses = [
        jsonResponse({ gatewayId: '565697', currencies: ['USD'], messages: OK }),
        jsonResponse({ batchList: [batch('10198080', '2.00')], messages: OK }),
        jsonResponse({ transactions: page(2, 1), totalNumInResultSet: 2, messages: OK }),
      ]
      const opened = await run({})
      const headers = await run({ cursor: opened.nextState.cursor })
      const record = asRecords(await run({ cursor: headers.nextState.cursor }))[0]!
      return [
        record.fields.sourceKey,
        ...record.fields.processorTransactions.map((child: any) => child.sourceKey),
      ]
    }

    const first = await keys()
    const second = await keys()
    expect(first).toEqual([
      JSON.stringify(['authorize_net', '565697', 'live', '10198080']),
      JSON.stringify(['authorize_net', '565697', 'live', '1']),
      JSON.stringify(['authorize_net', '565697', 'live', '2']),
    ])
    // A re-sync identity-matches rather than duplicating; the scan id differs.
    expect(second).toEqual(first)
  })

  it('aborts when the environment changes mid-scan', async () => {
    const opened = await run({})
    await expect(
      fetchAuthorizeNetStream({
        streamKey: 'payout',
        mode: 'incremental',
        state: { cursor: opened.nextState.cursor },
        connection: { ...CONNECTION, fields: { ...CONNECTION.fields, environment: 'test' } },
        config: CONFIG,
      } as any)
    ).rejects.toThrow(/environment changed/)
  })

  it('refuses a cursor from an incompatible shape', async () => {
    await expect(run({ cursor: { version: 2 } })).rejects.toThrow(/incompatible cursor/)
    await expect(run({ cursor: { version: 1, streamKey: 'payout' } })).rejects.toThrow(
      /Invalid Authorize.net acquisition cursor/
    )
  })
})
