// tests/shipment-stream.test.ts

/**
 * The `shipment` stream: the genuine `modified_at` delta, the import floor, the
 * local status filter, and the three values this stream exists to carry.
 *
 * `fetch` is stubbed rather than the shared client, matching the other connector
 * tests, so the request each call builds is asserted too. No network is
 * reachable from these tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import shipstationSync, {
  type RawShipment,
  type ShipstationShipmentCursor,
  projectShipmentRecord,
} from '../src/shipstation.connector.server'

const PAGE_SIZE = 50
const IMPORT_START = '2025-10-01T00:00:00.000Z'
const SINCE = '2026-09-09T00:00:00.000Z'

function shipment(n: number, extra: Partial<RawShipment> = {}): RawShipment {
  return {
    shipment_id: `se-ship-${n}`,
    shipment_number: String(14_500 + n),
    store_id: 'se-2943015',
    shipment_status: 'label_purchased',
    created_at: '2026-09-08T00:00:00.000Z',
    modified_at: '2026-09-10T00:00:00.000Z',
    ...extra,
  }
}

function jsonPage(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

const fetchMock = vi.fn()

function args(overrides: Record<string, unknown> = {}) {
  return {
    streamKey: 'shipment',
    mode: 'snapshot',
    state: {},
    connection: { value: 'test-api-key' },
    config: { importStart: IMPORT_START },
    ...overrides,
  } as unknown as Parameters<typeof shipstationSync>[0]
}

const cursorOf = (result: { nextState: { cursor?: unknown } }) =>
  result.nextState.cursor as ShipstationShipmentCursor

const urlOf = (call: number) => new URL(String(fetchMock.mock.calls[call][0]))

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request shape', () => {
  it('issues one modified_at-sorted GET per execute, through the shared V2 client', async () => {
    fetchMock.mockResolvedValueOnce(jsonPage({ shipments: [shipment(1)], pages: 1, total: 1 }))
    await shipstationSync(args())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    const parsed = new URL(String(url))
    expect(parsed.origin).toBe('https://api.shipstation.com')
    expect(parsed.pathname).toBe('/v2/shipments')
    expect(parsed.searchParams.get('modified_at_start')).toBe(IMPORT_START)
    expect(parsed.searchParams.get('modified_at_end')).toBeTruthy()
    expect(parsed.searchParams.get('sort_by')).toBe('modified_at')
    expect(parsed.searchParams.get('sort_dir')).toBe('asc')
    expect(parsed.searchParams.get('page')).toBe('1')
    expect(parsed.searchParams.get('page_size')).toBe(String(PAGE_SIZE))
    expect((init as RequestInit & { headers: Record<string, string> }).headers['api-key']).toBe(
      'test-api-key'
    )
    expect((init as RequestInit).redirect).toBe('error')
  })

  it('sends the import floor on every request, so a delta cannot widen the population', async () => {
    // `modified_at_start` alone would admit a shipment created years before the
    // configured import start the moment anyone touched it.
    fetchMock.mockResolvedValueOnce(jsonPage({ shipments: [], pages: 1, total: 0 }))
    await shipstationSync(args({ state: { updatedSince: SINCE } }))

    const url = urlOf(0)
    expect(url.searchParams.get('modified_at_start')).toBe(SINCE)
    expect(url.searchParams.get('created_at_start')).toBe(IMPORT_START)
  })

  it('refuses to run without the connector-bound connection', async () => {
    await expect(shipstationSync(args({ connection: null }))).rejects.toThrow(/missing connection/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses to guess an import window when the config has no importStart', async () => {
    await expect(shipstationSync(args({ config: {} }))).rejects.toThrow(/importStart/)
  })
})

describe('projection', () => {
  it('carries exactly the three values that live on the shipment resource', () => {
    const record = projectShipmentRecord(shipment(1))
    expect(record.streamKey).toBe('shipment')
    expect(record.externalId).toBe('se-ship-1')
    expect(record.displayName).toBe('14501')
    expect(record.fields).toEqual({
      shipmentId: 'se-ship-1',
      shipmentNumber: '14501',
      storeId: 'se-2943015',
    })
  })

  it('never fans out the shipment packages', () => {
    // `GET /v2/shipments` returns package DEFINITIONS: distinct
    // `shipment_package_id`s, the SAME `package_id` on every row and no tracking
    // number. They are a packaging type, not a box. Parcels come from labels.
    const withPackages = {
      ...shipment(1),
      packages: [{ package_id: 'se-3', shipment_package_id: 'sp-1' }],
    } as RawShipment
    expect(projectShipmentRecord(withPackages).fields.packages).toBeUndefined()
  })

  it('leaves the shipment nameless rather than inventing one', () => {
    // `shipment_number` is documented as optional, mutable and non-unique.
    const record = projectShipmentRecord(shipment(1, { shipment_number: null }))
    expect(record.fields.shipmentNumber).toBeNull()
    expect(record.displayName).toBe('se-ship-1')
  })

  it('does not carry carrier, service, ship date, status or the external order id', () => {
    // All five belong to the label stream. Two mappings of one connector writing
    // one cell is the flip-flop the connector header warns about.
    const record = projectShipmentRecord(shipment(1))
    for (const key of ['carrier', 'service', 'shipDate', 'shipmentStatus', 'externalOrderId']) {
      expect(record.fields[key]).toBeUndefined()
    }
  })
})

describe('the local status filter', () => {
  it('emits shipments that have had a label and skips drafts', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        shipments: [
          shipment(1, { shipment_status: 'label_purchased' }),
          shipment(2, { shipment_status: 'pending' }),
          shipment(3, { shipment_status: 'processing' }),
          shipment(4, { shipment_status: 'cancelled' }),
        ],
        pages: 1,
        total: 4,
      })
    )
    const result = await shipstationSync(args())
    const records = Array.isArray(result.records) ? result.records : []
    expect(records.map((r) => r.externalId)).toEqual(['se-ship-1', 'se-ship-4'])
  })

  it('keeps paging when the filter empties a full page', async () => {
    // Pagination is decided by the RAW page. A page filtered away entirely is
    // still a full page, and treating it as the end would truncate the crawl.
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        shipments: Array.from({ length: PAGE_SIZE }, (_, i) =>
          shipment(i + 1, { shipment_status: 'pending' })
        ),
        pages: 3,
        total: 120,
      })
    )
    const result = await shipstationSync(args())
    expect(Array.isArray(result.records) && result.records).toHaveLength(0)
    expect(result.nextState.backfillComplete).toBeFalsy()
    expect(cursorOf(result).page).toBe(2)
  })
})

describe('paging and the watermark', () => {
  it('returns one page and a cursor pointing at the next', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        shipments: Array.from({ length: PAGE_SIZE }, (_, i) => shipment(i + 1)),
        pages: 4,
        total: 200,
      })
    )
    const result = await shipstationSync(args())
    expect(Array.isArray(result.records) && result.records).toHaveLength(PAGE_SIZE)
    expect(cursorOf(result).page).toBe(2)
    // Mid-crawl: no watermark, so a run that dies here re-reads rather than skips.
    expect(result.nextState.updatedSince).toBeUndefined()
  })

  it('freezes the horizon for the whole run and advances the watermark to it', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        shipments: Array.from({ length: PAGE_SIZE }, (_, i) => shipment(i + 1)),
        pages: 2,
        total: 100,
      })
    )
    const first = await shipstationSync(args())
    const frozen = cursorOf(first).runEnd
    expect(cursorOf(first).windows[0].end).toBe(frozen)

    fetchMock.mockResolvedValueOnce(jsonPage({ shipments: [shipment(51)], pages: 2, total: 100 }))
    const done = await shipstationSync(args({ state: { cursor: cursorOf(first) } }))
    expect(urlOf(1).searchParams.get('modified_at_end')).toBe(frozen)
    expect(done.nextState.backfillComplete).toBe(true)
    expect(done.nextState.updatedSince).toBe(frozen)
  })

  it('subdivides a window holding more rows than the offset ceiling', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        shipments: Array.from({ length: PAGE_SIZE }, (_, i) => shipment(i + 1)),
        pages: 900,
        total: 45_000,
      })
    )
    const result = await shipstationSync(args())
    const cursor = cursorOf(result)
    expect(cursor.windows).toHaveLength(2)
    expect(cursor.page).toBe(1)
    // The halves abut, so a shipment on the boundary is re-read rather than lost.
    expect(cursor.windows[0].end).toBe(cursor.windows[1].start)
    expect(cursor.windows[1].end).toBe(cursor.runEnd)
    expect(result.nextState.updatedSince).toBeUndefined()
  })
})

describe('throttling and failure', () => {
  it('returns rateLimited on a 429 instead of throwing or sleeping', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [{ message: 'slow down' }] }), {
        status: 429,
        headers: { 'retry-after': '3' },
      })
    )
    const result = await shipstationSync(args())
    expect(result.rateLimited?.retryAfterMs).toBe(3000)
    expect(cursorOf(result).page).toBe(1)
    expect(result.nextState.updatedSince).toBeUndefined()
  })

  it('preserves the watermark on a provider error by never returning one', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    await expect(shipstationSync(args({ state: { updatedSince: SINCE } }))).rejects.toThrow()

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }))
    await expect(shipstationSync(args({ state: { updatedSince: SINCE } }))).rejects.toThrow()
  })

  it('advances no watermark when the run stops at the page budget', async () => {
    const spent: ShipstationShipmentCursor = {
      runEnd: '2026-09-11T00:00:00.000Z',
      windows: [{ start: IMPORT_START, end: '2026-09-11T00:00:00.000Z' }],
      page: 1,
      pagesFetched: 2_000,
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await shipstationSync(args({ state: { cursor: spent } }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.nextState.updatedSince).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
