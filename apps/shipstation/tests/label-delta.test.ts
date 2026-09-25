// tests/label-delta.test.ts

/**
 * The steady-phase label delta: two sweeps, one `since: { created, voided }`,
 * and the rules that make advancing either floor safe.
 *
 * `fetch` is stubbed rather than the shared client, matching `label-crawl.test.ts`,
 * so the request each sweep actually builds (path, query, sort direction) is
 * asserted too. No network is reachable from these tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import shipstationSync, {
  type LabelSince,
  type RawConnectorLabel,
  readLabelSince,
  type ShipstationLabelCursor,
  projectLabelRecord,
} from '../src/shipstation.connector.server'

const PAGE_SIZE = 50
const IMPORT_START = '2025-10-01T00:00:00.000Z'
const CREATED_SINCE = '2026-09-01T00:00:00.000Z'
const VOIDED_SINCE = '2026-09-05T00:00:00.000Z'
const SINCE: LabelSince = { created: CREATED_SINCE, voided: VOIDED_SINCE }
const QUERY = { period: { from: IMPORT_START } }
/** A steady run: the floor rides along with the previous run's `since`. */
const STEADY = { ...QUERY, since: SINCE }

function label(n: number, extra: Partial<RawConnectorLabel> = {}): RawConnectorLabel {
  return {
    label_id: `se-${n}`,
    shipment_id: `se-ship-${n}`,
    carrier_code: 'fedex',
    service_code: 'fedex_home_delivery',
    tracking_number: `TRACK-${n}`,
    tracking_status: 'in_transit',
    shipment_status: 'label_purchased',
    voided: false,
    created_at: '2026-09-09T00:00:00.000Z',
    ship_date: '2026-09-10T07:00:00Z',
    packages: [{ package_id: 100_000 + n, sequence: 1, tracking_number: `TRACK-${n}` }],
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
    streamKey: 'label',
    query: QUERY,
    connection: { value: 'test-api-key' },
    config: {},
    ...overrides,
  } as unknown as Parameters<typeof shipstationSync>[0]
}

const cursorOf = (result: { cursor?: unknown }) => result.cursor as ShipstationLabelCursor

const urlOf = (call: number) => new URL(String(fetchMock.mock.calls[call][0]))

const sinceOf = (result: { since?: unknown }) => result.since as LabelSince | undefined

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('reading since back', () => {
  it('reads both floors and normalizes them to ISO instants', () => {
    expect(readLabelSince(SINCE)).toEqual(SINCE)
    expect(readLabelSince({ created: '2026-09-01', voided: '2026-09-05' })).toEqual(SINCE)
  })

  it('reads a missing or unusable marker as none, never as a floor of zero', () => {
    expect(readLabelSince(undefined)).toBeNull()
    expect(readLabelSince('')).toBeNull()
    expect(readLabelSince('2026-09-01T00:00:00.000Z|2026-09-05T00:00:00.000Z')).toBeNull()
    expect(readLabelSince({ created: 'not-a-date', voided: VOIDED_SINCE })).toBeNull()
  })
})

describe('phase selection', () => {
  it('crawls from the period floor when the query carries no since', async () => {
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [label(1)], pages: 1, total: 1 }))
    const result = await shipstationSync(args())

    expect(urlOf(0).searchParams.get('created_at_start')).toBe(IMPORT_START)
    // A full crawl has nothing after it, so both floors advance together.
    expect(sinceOf(result)?.created).toBe(sinceOf(result)?.voided)
    expect(result.cursor).toBeUndefined()
  })

  it('opens the delta from query.since', async () => {
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [label(1)], pages: 1, total: 1 }))
    const result = await shipstationSync(args({ query: STEADY }))

    const url = urlOf(0)
    expect(url.pathname).toBe('/v2/labels')
    expect(url.searchParams.get('created_at_start')).toBe(CREATED_SINCE)
    expect(url.searchParams.get('sort_by')).toBe('created_at')
    expect(url.searchParams.get('sort_dir')).toBe('asc')
    // The created half is done, so the void sweep is queued next; `since` waits for
    // the last page.
    expect(cursorOf(result).delta?.sweep).toBe('voided')
    expect(cursorOf(result).delta?.voidedSince).toBe(VOIDED_SINCE)
    expect(result.since).toBeUndefined()
  })

  it('never reads created labels from before the period floor, whatever since says', async () => {
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [], pages: 1, total: 0 }))
    const floor = '2026-09-03T00:00:00.000Z'
    await shipstationSync(args({ query: { period: { from: floor }, since: SINCE } }))
    expect(urlOf(0).searchParams.get('created_at_start')).toBe(floor)
  })

  it('falls back to the floor when since is unreadable, rather than skipping history', async () => {
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [], pages: 1, total: 0 }))
    await shipstationSync(args({ query: { ...QUERY, since: 'garbage' } }))
    expect(urlOf(0).searchParams.get('created_at_start')).toBe(IMPORT_START)
  })

  it('still runs the void sweep when no label was created since the last run', async () => {
    // An empty created window must not end the run: the void sweep is the half
    // that carries the change a creation marker cannot see.
    const now = new Date().toISOString()
    const result = await shipstationSync(
      args({ query: { ...QUERY, since: { created: now, voided: now } } })
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(cursorOf(result).delta?.sweep).toBe('voided')
    expect(result.since).toBeUndefined()
  })
})

describe('the void sweep', () => {
  /** Drive the created half to exhaustion and hand back the void-sweep cursor. */
  async function toVoidSweep() {
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [], pages: 1, total: 0 }))
    const first = await shipstationSync(args({ query: STEADY }))
    fetchMock.mockReset()
    return cursorOf(first)
  }

  it('asks for voided labels newest-first, with no created-time filter', async () => {
    const cursor = await toVoidSweep()
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [], pages: 1, total: 0 }))
    await shipstationSync(args({ query: STEADY, cursor }))

    const url = urlOf(0)
    expect(url.pathname).toBe('/v2/labels')
    expect(url.searchParams.get('label_status')).toBe('voided')
    expect(url.searchParams.get('sort_by')).toBe('voided_at')
    expect(url.searchParams.get('sort_dir')).toBe('desc')
    // There is no `voided_at_start` filter on this endpoint, so the stop has to
    // be read off the rows and a creation-time filter would be the wrong bound.
    expect(url.searchParams.get('created_at_start')).toBeNull()
  })

  it('stops at the first label voided at or before since.voided', async () => {
    const cursor = await toVoidSweep()
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        labels: [
          label(1, { voided: true, voided_at: '2026-09-07T00:00:00.000Z' }),
          label(2, { voided: true, voided_at: '2026-09-06T00:00:00.000Z' }),
          // At the marker exactly: already seen, so the sweep stops HERE.
          label(3, { voided: true, voided_at: VOIDED_SINCE }),
          label(4, { voided: true, voided_at: '2026-09-04T00:00:00.000Z' }),
        ],
        pages: 9,
        total: 450,
      })
    )
    const result = await shipstationSync(args({ query: STEADY, cursor }))

    const records = Array.isArray(result.records) ? result.records : []
    expect(records.map((r) => r.externalId)).toEqual(['se-1', 'se-2'])
    // Stopping is the end of the sweep even though the provider reports 9 pages.
    expect(result.cursor).toBeUndefined()
    expect(result.since).toBeDefined()
  })

  it('does not stop on a voided label with no usable voided_at', async () => {
    // Stopping there would truncate the sweep on a data quirk and silently drop
    // every older void. Over-reading is idempotent; under-reading is not.
    const cursor = await toVoidSweep()
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        labels: [
          label(1, { voided: true, voided_at: null }),
          label(2, { voided: true, voided_at: '2026-09-06T00:00:00.000Z' }),
        ],
        pages: 1,
        total: 2,
      })
    )
    const result = await shipstationSync(args({ query: STEADY, cursor }))
    const records = Array.isArray(result.records) ? result.records : []
    expect(records.map((r) => r.externalId)).toEqual(['se-1', 'se-2'])
  })

  it('skips a void on a label created before the floor, and keeps paging anyway', async () => {
    // The void sweep is unbounded in creation time by construction, so the
    // floor has to be applied locally. Pagination is decided by the RAW page,
    // so a page emptied by that filter is still a full page.
    const cursor = await toVoidSweep()
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        labels: Array.from({ length: PAGE_SIZE }, (_, i) =>
          label(i + 1, {
            voided: true,
            voided_at: '2026-09-07T00:00:00.000Z',
            created_at: '2024-01-01T00:00:00.000Z',
          })
        ),
        pages: 4,
        total: 200,
      })
    )
    const result = await shipstationSync(args({ query: STEADY, cursor }))

    expect(Array.isArray(result.records) && result.records).toHaveLength(0)
    expect(result.cursor).toBeDefined()
    expect(cursorOf(result).page).toBe(2)
  })

  it('advances both floors only when the sweep is exhausted', async () => {
    const cursor = await toVoidSweep()
    fetchMock.mockResolvedValueOnce(
      jsonPage({
        labels: Array.from({ length: PAGE_SIZE }, (_, i) =>
          label(i + 1, { voided: true, voided_at: '2026-09-07T00:00:00.000Z' })
        ),
        pages: 4,
        total: 200,
      })
    )
    const midSweep = await shipstationSync(args({ query: STEADY, cursor }))
    // Mid-sweep: no `since` at all, so the platform keeps the stored pair.
    expect(midSweep.since).toBeUndefined()

    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [], pages: 4, total: 200 }))
    const done = await shipstationSync(args({ query: STEADY, cursor: cursorOf(midSweep) }))
    expect(done.cursor).toBeUndefined()
    expect(sinceOf(done)?.voided).toBe(cursor.runEnd)
    // The created half keeps the value its own sweep proved, not a fresh `now`.
    expect(sinceOf(done)?.created).toBe(cursor.runEnd)
  })
})

describe('preserving both floors on failure', () => {
  it('advances neither floor when the created sweep errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    await expect(shipstationSync(args({ query: STEADY }))).rejects.toThrow()

    // Throwing is what preserves them: no `since` is ever produced, so the
    // platform keeps the pair it already had.
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }))
    await expect(shipstationSync(args({ query: STEADY }))).rejects.toThrow()
  })

  it('returns no since when the void sweep errors after the created sweep finished', async () => {
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [label(1)], pages: 1, total: 1 }))
    const createdDone = await shipstationSync(args({ query: STEADY }))
    // `since` rides the last page only, so the created half re-reads if the void sweep fails.
    expect(createdDone.since).toBeUndefined()
    expect(cursorOf(createdDone).delta?.createdSince).toBe(cursorOf(createdDone).runEnd)

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    await expect(
      shipstationSync(args({ query: STEADY, cursor: cursorOf(createdDone) }))
    ).rejects.toThrow()
  })

  it('returns rateLimited on a 429 in either sweep, with no cursor and no since', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [{ message: 'slow down' }] }), {
        status: 429,
        headers: { 'retry-after': '7' },
      })
    )
    const created = await shipstationSync(args({ query: STEADY }))
    expect(created.rateLimited?.retryAfterMs).toBe(7000)
    expect(created.since).toBeUndefined()
    expect(created.cursor).toBeUndefined()

    fetchMock.mockReset()
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [], pages: 1, total: 0 }))
    const atVoidSweep = cursorOf(await shipstationSync(args({ query: STEADY })))

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 429 }))
    const voided = await shipstationSync(args({ query: STEADY, cursor: atVoidSweep }))
    expect(voided.rateLimited).toBeDefined()
    // No `Retry-After` must NOT become 0, which would ask for an instant retry.
    expect(voided.rateLimited?.retryAfterMs).toBeUndefined()
    expect(voided.since).toBeUndefined()
    expect(voided.cursor).toBeUndefined()
  })

  it('returns no since when the run stops at the page budget', async () => {
    const spent: ShipstationLabelCursor = {
      runEnd: '2026-09-11T00:00:00.000Z',
      windows: [{ start: CREATED_SINCE, end: '2026-09-11T00:00:00.000Z' }],
      page: 1,
      pagesFetched: 2_000,
      delta: { sweep: 'created', createdSince: CREATED_SINCE, voidedSince: VOIDED_SINCE },
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await shipstationSync(args({ query: STEADY, cursor: spent }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.since).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

// ── the three load-bearing rules, and the voided-master fallback ──────────────

/**
 * Probe §3's pair: one shipment, a voided label and its replacement, both
 * sharing `se-426507931`.
 */
const voidedLabel: RawConnectorLabel = label(101, {
  label_id: 'se-196479007',
  shipment_id: 'se-426507931',
  tracking_number: 'EXAMPLE-TRACKING-VOID',
  voided: true,
  voided_at: '2026-09-08T22:52:25.177Z',
  created_at: '2026-09-08T22:50:32.873Z',
  packages: [{ package_id: 158000001, sequence: 1, tracking_number: 'EXAMPLE-TRACKING-VOID' }],
})

const replacementLabel: RawConnectorLabel = label(102, {
  label_id: 'se-196479653',
  shipment_id: 'se-426507931',
  tracking_number: 'EXAMPLE-TRACKING-LIVE',
  voided: false,
  voided_at: null,
  created_at: '2026-09-08T22:52:48.923Z',
  packages: [{ package_id: 158000002, sequence: 1, tracking_number: 'EXAMPLE-TRACKING-LIVE' }],
})

/** The six fields the sink would write onto the shared `shipment` row. */
const SHIPMENT_FIELDS = [
  'carrier',
  'service',
  'shipDate',
  'parcelCount',
  'shipmentStatus',
  'masterTrackingNumber',
] as const

/**
 * Apply one slice's records the way the sink does for the shipment mapping:
 * records arrive in crawl order and a later `overwrite` binding replaces an
 * earlier one. Fields a record does not emit are not writes at all.
 */
function applySlice(labels: readonly RawConnectorLabel[]): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const raw of labels) {
    const record = projectLabelRecord(raw)
    for (const key of SHIPMENT_FIELDS) {
      if (record.fields[key] !== undefined) row[key] = record.fields[key]
    }
  }
  return row
}

describe('rule 3: shipment structural fields only from non-voided labels', () => {
  it('emits no carrier, service, ship date, parcel count or status from a voided label', () => {
    const record = projectLabelRecord(voidedLabel)
    for (const key of ['shipmentNumber', 'carrier', 'service', 'shipDate', 'parcelCount']) {
      expect(record.fields[key]).toBeUndefined()
    }
    expect(record.fields.shipmentStatus).toBeUndefined()
  })

  it('produces deterministic shipment fields for a void plus reprint, across two runs', async () => {
    // The crawl is `created_at` ascending, so the pair always arrives
    // voided-then-live. Run the whole delta twice against the same provider
    // pages and compare what the shipment row would hold.
    async function run() {
      fetchMock.mockReset()
      fetchMock.mockResolvedValueOnce(
        jsonPage({ labels: [voidedLabel, replacementLabel], pages: 1, total: 2 })
      )
      const created = await shipstationSync(args({ query: STEADY }))
      fetchMock.mockResolvedValueOnce(jsonPage({ labels: [voidedLabel], pages: 1, total: 1 }))
      const voidSweep = await shipstationSync(args({ query: STEADY, cursor: cursorOf(created) }))
      const emitted = [
        ...(Array.isArray(created.records) ? created.records : []),
        ...(Array.isArray(voidSweep.records) ? voidSweep.records : []),
      ]
      const row: Record<string, unknown> = {}
      for (const record of emitted) {
        for (const key of SHIPMENT_FIELDS) {
          if (record.fields[key] !== undefined) row[key] = record.fields[key]
        }
      }
      return row
    }

    const first = await run()
    const second = await run()
    expect(first).toEqual(second)
    // And the values are the LIVE label's, even though the voided label is read
    // twice (once by each sweep) and the live label only once.
    expect(first.carrier).toBe('fedex')
    expect(first.masterTrackingNumber).toBe('EXAMPLE-TRACKING-LIVE')
  })

  it('emits no master tracking number from the void sweep, whatever it re-reads', async () => {
    // 🛑 The regression this guards. The void sweep runs AFTER the created sweep
    // and is sorted `voided_at` descending, so a voided label it re-reads would
    // reach the sink after the live label that replaced it. Emitting the master
    // there overwrites the shipment's display name with a dead number, and which
    // number a shipment ends up with then depends on sweep order.
    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [], pages: 1, total: 0 }))
    const atVoidSweep = cursorOf(await shipstationSync(args({ query: STEADY })))

    fetchMock.mockResolvedValueOnce(jsonPage({ labels: [voidedLabel], pages: 1, total: 1 }))
    const result = await shipstationSync(args({ query: STEADY, cursor: atVoidSweep }))
    const records = Array.isArray(result.records) ? result.records : []
    expect(records).toHaveLength(1)
    expect(records[0].fields.masterTrackingNumber).toBeUndefined()
    // The void state itself still travels, which is the whole point of the sweep.
    expect(records[0].fields.labelVoided).toBe(true)
    expect(records[0].fields.labelVoidedAt).toBe('2026-09-08T22:52:25.177Z')
  })

  it('is unaffected by page order for everything except the master number', () => {
    // A voided label emits none of the other five, so whichever record the sink
    // lets win, those five can only ever come from the live label.
    const forwards = applySlice([voidedLabel, replacementLabel])
    const backwards = applySlice([replacementLabel, voidedLabel])
    for (const key of ['carrier', 'service', 'shipDate', 'parcelCount', 'shipmentStatus']) {
      expect(forwards[key]).toEqual(backwards[key])
    }
  })
})

describe('the voided-master fallback', () => {
  it('names a shipment whose every label is voided', () => {
    // Build plan §9: 1 of 135 live shipments had every label voided and rendered
    // nameless, because `shipment_master_tracking_number` is the shipment's
    // primary display field and nothing was writing it.
    const record = projectLabelRecord(voidedLabel)
    expect(record.fields.masterTrackingNumber).toBe('EXAMPLE-TRACKING-VOID')
    expect(applySlice([voidedLabel]).masterTrackingNumber).toBe('EXAMPLE-TRACKING-VOID')
  })

  it('still lets the live label win when there is one', () => {
    expect(applySlice([voidedLabel, replacementLabel]).masterTrackingNumber).toBe(
      'EXAMPLE-TRACKING-LIVE'
    )
  })

  it('keeps the voided parcels, so the void history survives', () => {
    const record = projectLabelRecord(voidedLabel)
    const packages = record.fields.packages as { voided: boolean; packageKey: string }[]
    expect(packages).toHaveLength(1)
    expect(packages[0].voided).toBe(true)
    expect(packages[0].packageKey).toBe('se-196479007:158000001')
  })
})
