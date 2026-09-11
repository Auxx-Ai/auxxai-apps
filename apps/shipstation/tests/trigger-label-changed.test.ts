// tests/trigger-label-changed.test.ts

/**
 * `shipstation.label-changed`: two cursors in one trigger.
 *
 * The interesting cases are the void branch, which is a DESCENDING scan and so
 * may only advance its watermark when it actually reached it, and the
 * `changeTypes` filter, which decides which branch runs at all.
 *
 * `shipstationApi` is mocked, so no network is reached.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/tools/shared/shipstation-api', () => ({
  shipstationApi: vi.fn(),
}))

import { shipstationApi } from '../src/tools/shared/shipstation-api'
import execute from '../src/triggers/label-changed/label-changed.server'

const api = shipstationApi as unknown as ReturnType<typeof vi.fn>

const CREATED_W = '2026-09-01T00:00:00.000Z'
const VOIDED_W = '2026-09-01T00:00:00.000Z'

function label(id: string, fields: Record<string, unknown> = {}) {
  return {
    label_id: id,
    shipment_id: `se-ship-${id}`,
    carrier_code: 'fedex',
    service_code: 'fedex_home_delivery',
    tracking_number: `TRACK-${id}`,
    status: 'completed',
    tracking_status: 'in_transit',
    voided: false,
    packages: [{ tracking_number: `TRACK-${id}` }],
    ...fields,
  }
}

const polling = (state: Record<string, unknown> = {}) => ({
  state,
  connection: { value: 'test-api-key' },
})

const started = (overrides: Record<string, unknown> = {}) =>
  polling({
    createdAtWatermark: CREATED_W,
    voidedAtWatermark: VOIDED_W,
    voidedEmittedIds: [],
    ...overrides,
  })

/** Route each mocked call by the branch its query identifies. */
function route(handlers: {
  created?: (query: Record<string, unknown>) => unknown
  voided?: (query: Record<string, unknown>) => unknown
}) {
  api.mockImplementation(
    async (_endpoint: string, _key: string, query: Record<string, unknown>) => {
      const handler = query.label_status === 'voided' ? handlers.voided : handlers.created
      if (!handler) return { labels: [], pages: 1 }
      const result = handler(query)
      if (result instanceof Error) throw result
      return result
    }
  )
}

beforeEach(() => {
  api.mockReset()
})

describe('label-changed execute', () => {
  it('emits nothing and establishes both watermarks on the first run', async () => {
    const before = Date.now()
    const result = await execute({}, polling())

    expect(result.events).toEqual([])
    expect(api).not.toHaveBeenCalled()
    expect(Date.parse(result.state.createdAtWatermark as string)).toBeGreaterThanOrEqual(before)
    expect(Date.parse(result.state.voidedAtWatermark as string)).toBeGreaterThanOrEqual(before)
  })

  it('emits only labels created after the watermark, tagged created', async () => {
    route({
      created: () => ({
        labels: [
          // `created_at_start` is inclusive: the boundary row comes back.
          label('se-1', { created_at: CREATED_W }),
          label('se-2', { created_at: '2026-09-01T01:00:00.000Z' }),
        ],
        pages: 1,
      }),
      voided: () => ({ labels: [], pages: 1 }),
    })

    const result = await execute({ changeTypes: ['created'] }, started())

    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({ labelId: 'se-2', changeType: 'created' })
    expect(result.state.createdAtWatermark).toBe('2026-09-01T01:00:00.000Z')
  })

  it('builds the two branch queries the API actually supports', async () => {
    route({ created: () => ({ labels: [], pages: 1 }), voided: () => ({ labels: [], pages: 1 }) })

    await execute({ carrierId: 'se-carrier' }, started())

    const queries = api.mock.calls.map((call) => call[2] as Record<string, unknown>)
    expect(queries).toContainEqual(
      expect.objectContaining({
        created_at_start: CREATED_W,
        sort_by: 'created_at',
        sort_dir: 'asc',
        carrier_id: 'se-carrier',
      })
    )
    expect(queries).toContainEqual(
      expect.objectContaining({
        label_status: 'voided',
        sort_by: 'voided_at',
        sort_dir: 'desc',
        carrier_id: 'se-carrier',
      })
    )
    // `modified_at` is never returned on a label, so it must never be the cursor.
    for (const query of queries) expect(query.sort_by).not.toBe('modified_at')
  })

  it('stops the descending void scan at the first label at or before the watermark', async () => {
    route({
      voided: () => ({
        labels: [
          label('se-v1', { voided: true, voided_at: '2026-09-01T03:00:00.000Z' }),
          label('se-v2', { voided: true, voided_at: '2026-09-01T02:00:00.000Z' }),
          // At the watermark: the scan stops here and everything below is old.
          label('se-v3', { voided: true, voided_at: VOIDED_W }),
          label('se-v4', { voided: true, voided_at: '2026-08-30T00:00:00.000Z' }),
        ],
        pages: 4,
      }),
    })

    const result = await execute({ changeTypes: ['voided'] }, started())

    expect(result.events.map((e) => e.labelId)).toEqual(['se-v1', 'se-v2'])
    expect(result.events[0]).toMatchObject({ changeType: 'voided', voided: true })
    expect(result.state.voidedAtWatermark).toBe('2026-09-01T03:00:00.000Z')
    expect(result.state.voidedEmittedIds).toEqual([])
    // It stopped inside page 1 rather than paging on.
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('holds the void watermark when the scan never reached it, and de-dupes next run', async () => {
    // Every page is full of voids newer than the watermark: the scan is behind.
    route({
      voided: (query) => ({
        labels: [
          label(`se-v${query.page}`, {
            voided: true,
            voided_at: `2026-09-0${query.page}T05:00:00.000Z`,
          }),
        ],
        pages: 99,
      }),
    })

    const first = await execute({ changeTypes: ['voided'] }, started())

    expect(api).toHaveBeenCalledTimes(5)
    expect(first.events).toHaveLength(5)
    // Advancing here would skip the unread middle of a descending scan.
    expect(first.state.voidedAtWatermark).toBe(VOIDED_W)
    expect(first.state.voidedEmittedIds).toEqual(['se-v1', 'se-v2', 'se-v3', 'se-v4', 'se-v5'])

    api.mockClear()
    const second = await execute(
      { changeTypes: ['voided'] },
      started({ voidedEmittedIds: first.state.voidedEmittedIds })
    )
    expect(second.events).toEqual([])
  })

  it('holds the void watermark on an upstream error', async () => {
    route({ voided: () => new Error('upstream is down') })

    const result = await execute({ changeTypes: ['voided'] }, started())

    expect(result.events).toEqual([])
    expect(result.state.voidedAtWatermark).toBe(VOIDED_W)
  })

  it('holds the created watermark when the first page fails', async () => {
    route({ created: () => new Error('upstream is down') })

    const result = await execute({ changeTypes: ['created'] }, started())

    expect(result.events).toEqual([])
    expect(result.state.createdAtWatermark).toBe(CREATED_W)
  })

  it('runs both branches when no change type is selected', async () => {
    route({
      created: () => ({
        labels: [label('se-1', { created_at: '2026-09-01T01:00:00.000Z' })],
        pages: 1,
      }),
      voided: () => ({
        labels: [
          label('se-2', { voided: true, voided_at: '2026-09-01T02:00:00.000Z' }),
          label('se-3', { voided: true, voided_at: VOIDED_W }),
        ],
        pages: 1,
      }),
    })

    const result = await execute({ changeTypes: [] }, started())

    expect(result.events.map((e) => e.changeType)).toEqual(['created', 'voided'])
  })

  it('keeps a switched-off branch current so re-enabling does not replay history', async () => {
    route({ created: () => ({ labels: [], pages: 1 }) })

    const before = Date.now()
    const result = await execute({ changeTypes: ['created'] }, started())

    expect(Date.parse(result.state.voidedAtWatermark as string)).toBeGreaterThanOrEqual(before)
    // The void branch never ran.
    expect(api).toHaveBeenCalledTimes(1)
  })
})
