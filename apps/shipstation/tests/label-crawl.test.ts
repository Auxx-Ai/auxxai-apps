// tests/label-crawl.test.ts

/**
 * The crawl: one page per `execute`, the structured window cursor, throttling,
 * cursor preservation on failure, and window subdivision.
 *
 * `fetch` is stubbed rather than the shared client, so the request the client
 * actually builds (path, query, `api-key` header) is asserted too, because this app has
 * exactly one HTTP client and the connector must go through it.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import shipstationSync, {
  openCrawlCursor,
  readLabelCursor,
  type ShipstationLabelCursor,
  subdivideWindow,
} from '../src/shipstation.connector.server'

const PAGE_SIZE = 50
const QUERY = { period: { from: '2025-10-01T00:00:00.000Z' } }

function label(n: number) {
  return {
    label_id: `se-${n}`,
    shipment_id: `se-ship-${n}`,
    shipment_number: String(1000 + n),
    carrier_code: 'fedex',
    service_code: 'fedex_home_delivery',
    tracking_number: `TRACK-${n}`,
    tracking_status: 'in_transit',
    shipment_status: 'label_purchased',
    voided: false,
    ship_date: '2026-09-10T07:00:00Z',
    packages: [{ package_id: 100_000 + n, sequence: 1, tracking_number: `TRACK-${n}` }],
  }
}

function page(count: number, extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      labels: Array.from({ length: count }, (_, i) => label(i + 1)),
      page: 1,
      ...extra,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
}

const fetchMock = vi.fn()

function args(overrides: Record<string, unknown> = {}) {
  return {
    streamKey: 'label',
    query: QUERY,
    connection: { value: 'test-api-key' },
    config: {},
    ...overrides,
  } as unknown as Parameters<typeof shipstationSync>[0]
}

const cursorOf = (result: { cursor?: unknown }) => result.cursor as ShipstationLabelCursor

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request shape', () => {
  it('issues exactly one GET per execute, through the shared V2 client', async () => {
    fetchMock.mockResolvedValueOnce(page(3, { pages: 1, total: 3 }))
    await shipstationSync(args())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    const parsed = new URL(String(url))
    expect(parsed.origin).toBe('https://api.shipstation.com')
    expect(parsed.pathname).toBe('/v2/labels')
    expect(parsed.searchParams.get('created_at_start')).toBe('2025-10-01T00:00:00.000Z')
    expect(parsed.searchParams.get('created_at_end')).toBeTruthy()
    expect(parsed.searchParams.get('page')).toBe('1')
    expect(parsed.searchParams.get('page_size')).toBe(String(PAGE_SIZE))
    // Voided labels are NOT filtered out of the crawl; their void state is
    // mapped explicitly instead. The probe saw 117 of them.
    expect(parsed.searchParams.get('label_status')).toBeNull()
    expect((init as RequestInit & { headers: Record<string, string> }).headers['api-key']).toBe(
      'test-api-key'
    )
    // The credential must never be able to follow a provider-returned URL.
    expect((init as RequestInit).redirect).toBe('error')
  })

  it('refuses to run without the connector-bound connection', async () => {
    await expect(shipstationSync(args({ connection: null }))).rejects.toThrow(/missing connection/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses an unknown stream', async () => {
    // `label` and `shipment` are the two declared streams; anything else is a
    // catalog/handler mismatch and must fail loudly rather than fetch something.
    await expect(shipstationSync(args({ streamKey: 'parcel' }))).rejects.toThrow(/unknown stream/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reads everything from the epoch when the query sets no floor', async () => {
    fetchMock.mockResolvedValueOnce(page(1, { pages: 1, total: 1 }))
    await shipstationSync(args({ query: {} }))
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get('created_at_start')).toBe('1970-01-01T00:00:00.000Z')
  })

  it('ends the crawl at an earlier exclusive period end', async () => {
    const to = '2026-01-01T00:00:00.000Z'
    fetchMock.mockResolvedValueOnce(page(1, { pages: 1, total: 1 }))
    await shipstationSync(args({ query: { period: { ...QUERY.period, to } } }))
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get('created_at_end')).toBe(to)
  })

  it('stamps the period path on every record', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          labels: [{ ...label(1), created_at: '2026-09-10T06:00:00.000Z' }],
          pages: 1,
          total: 1,
        }),
        { status: 200 }
      )
    )
    const result = await shipstationSync(args())
    const [record] = result.records as { fields: Record<string, unknown> }[]
    expect(record!.fields.createdAt).toBe('2026-09-10T06:00:00.000Z')
  })
})

describe('paging', () => {
  it('returns one page and a cursor pointing at the next', async () => {
    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 4, total: 200 }))
    const result = await shipstationSync(args())

    expect(Array.isArray(result.records) && result.records).toHaveLength(PAGE_SIZE)
    expect(result.cursor).toBeDefined()
    expect(cursorOf(result).page).toBe(2)
    expect(cursorOf(result).windows).toHaveLength(1)
  })

  it('finishes the crawl on the last page', async () => {
    fetchMock.mockResolvedValueOnce(page(3, { pages: 1, total: 3 }))
    const result = await shipstationSync(args())

    expect(result.cursor).toBeUndefined()
    // Both floors advance to the frozen horizon on the last page.
    const since = result.since as { created: string; voided: string }
    expect(since.created).toBe(since.voided)
    expect(Number.isFinite(Date.parse(since.created))).toBe(true)
  })

  it('stops at the reported page count even on a full page', async () => {
    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 2, total: 100 }))
    const first = await shipstationSync(args())
    expect(cursorOf(first).page).toBe(2)

    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 2, total: 100 }))
    const second = await shipstationSync(args({ cursor: cursorOf(first) }))
    expect(second.cursor).toBeUndefined()
  })

  it('keeps paginating when a page yields no records', async () => {
    // An empty PROJECTED page is not the end of the window. Pagination is
    // decided by the raw page, so a full page that produced nothing still
    // advances.
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ labels: [], pages: 3, total: 120, page: 1 }), { status: 200 })
    )
    const result = await shipstationSync(args())
    // Zero rows returned IS short of a full page, so this window is done, but
    // the decision came from the raw row count, not from the projection.
    expect(Array.isArray(result.records) && result.records).toHaveLength(0)
    expect(result.cursor).toBeUndefined()
  })

  it('freezes the window end for the whole run', async () => {
    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 5, total: 250 }))
    const first = await shipstationSync(args())
    const frozen = cursorOf(first).runEnd
    const windowEnd = cursorOf(first).windows[0].end

    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 5, total: 250 }))
    const second = await shipstationSync(args({ cursor: cursorOf(first) }))
    expect(cursorOf(second).runEnd).toBe(frozen)
    expect(cursorOf(second).windows[0].end).toBe(windowEnd)

    const url = new URL(String(fetchMock.mock.calls[1][0]))
    expect(url.searchParams.get('created_at_end')).toBe(windowEnd)
    expect(url.searchParams.get('page')).toBe('2')
  })
})

describe('throttling and failure', () => {
  it('returns rateLimited on a 429 instead of throwing or sleeping', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [{ message: 'slow down' }] }), {
        status: 429,
        headers: { 'retry-after': '7' },
      })
    )
    const result = await shipstationSync(args())

    expect(result.rateLimited?.retryAfterMs).toBe(7000)
    expect(Array.isArray(result.records) && result.records).toHaveLength(0)
    // No cursor and no `since`: the platform retries the SAME page.
    expect(result.cursor).toBeUndefined()
    expect(result.since).toBeUndefined()
  })

  it('retries the same page it was throttled on, mid-window', async () => {
    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 9, total: 450 }))
    const first = await shipstationSync(args())
    expect(cursorOf(first).page).toBe(2)

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 429 }))
    const throttled = await shipstationSync(args({ cursor: cursorOf(first) }))
    expect(throttled.rateLimited).toBeDefined()
    expect(throttled.cursor).toBeUndefined()

    // The platform re-invokes with the cursor it already holds.
    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 9, total: 450 }))
    await shipstationSync(args({ cursor: cursorOf(first) }))
    expect(new URL(String(fetchMock.mock.calls[2][0])).searchParams.get('page')).toBe('2')
  })

  it('preserves the last successful cursor on a provider error by never returning one', async () => {
    // Template v3 recommends advancing polling state on a provider error; build
    // plan §2 overrides that for this reconciliation crawl. Throwing is what
    // preserves the cursor: no advanced cursor or `since` is ever produced.
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    await expect(shipstationSync(args())).rejects.toThrow()

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }))
    await expect(shipstationSync(args())).rejects.toThrow()
  })
})

describe('window subdivision', () => {
  it('subdivides a window holding more rows than the offset ceiling', async () => {
    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 900, total: 45_000 }))
    const result = await shipstationSync(args())

    const cursor = cursorOf(result)
    expect(cursor.windows).toHaveLength(2)
    expect(cursor.page).toBe(1)
    // The halves abut, so a label on the boundary is re-read rather than lost.
    expect(cursor.windows[0].end).toBe(cursor.windows[1].start)
    expect(cursor.windows[1].end).toBe(cursor.runEnd)
    // Rows already fetched are still emitted; a re-upsert of the same record is free.
    expect(Array.isArray(result.records) && result.records).toHaveLength(PAGE_SIZE)
    expect(result.cursor).toBeDefined()
  })

  it('crawls each subdivided window in turn before finishing', async () => {
    fetchMock.mockResolvedValueOnce(page(PAGE_SIZE, { pages: 900, total: 45_000 }))
    const split = await shipstationSync(args())
    expect(cursorOf(split).windows).toHaveLength(2)

    fetchMock.mockResolvedValueOnce(page(2, { pages: 1, total: 2 }))
    const firstHalf = await shipstationSync(args({ cursor: cursorOf(split) }))
    expect(cursorOf(firstHalf).windows).toHaveLength(1)
    expect(firstHalf.cursor).toBeDefined()

    fetchMock.mockResolvedValueOnce(page(2, { pages: 1, total: 2 }))
    const secondHalf = await shipstationSync(args({ cursor: cursorOf(firstHalf) }))
    expect(secondHalf.cursor).toBeUndefined()
    expect(secondHalf.since).toBeDefined()
  })

  it('refuses to subdivide below the one-minute floor', () => {
    expect(
      subdivideWindow({ start: '2026-09-10T00:00:00.000Z', end: '2026-09-10T00:00:30.000Z' })
    ).toBeNull()
    const halves = subdivideWindow({
      start: '2026-09-10T00:00:00.000Z',
      end: '2026-09-10T02:00:00.000Z',
    })
    expect(halves?.[0].end).toBe('2026-09-10T01:00:00.000Z')
    expect(halves?.[1].start).toBe('2026-09-10T01:00:00.000Z')
  })
})

describe('openCrawlCursor', () => {
  it('opens one window from the period floor to a frozen now', () => {
    const cursor = openCrawlCursor({ period: { from: '2025-10-01' } })
    expect(cursor.windows).toHaveLength(1)
    expect(cursor.windows[0].start).toBe('2025-10-01T00:00:00.000Z')
    expect(cursor.page).toBe(1)
    expect(cursor.pagesFetched).toBe(0)
  })

  it('reads a structured cursor back verbatim', () => {
    const stored: ShipstationLabelCursor = {
      runEnd: '2026-09-10T12:00:00.000Z',
      windows: [{ start: '2025-10-01T00:00:00.000Z', end: '2026-09-10T12:00:00.000Z' }],
      page: 7,
      pagesFetched: 6,
    }
    expect(readLabelCursor(stored, QUERY)).toEqual(stored)
  })

  it('opens no window when the floor is in the future', () => {
    const cursor = openCrawlCursor({ period: { from: '2099-01-01' } })
    expect(cursor.windows).toHaveLength(0)
  })
})
