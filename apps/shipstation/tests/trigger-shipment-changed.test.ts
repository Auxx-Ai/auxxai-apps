// tests/trigger-shipment-changed.test.ts

/**
 * `shipstation.shipment-changed`: the backfill/notification split, the inclusive
 * `modified_at_start` boundary, the page budget, and checkpoint preservation on
 * upstream error.
 *
 * `shipstationApi` is mocked, so no network is reached and the exact query the
 * execute builds is itself the assertion.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/tools/shared/shipstation-api', () => ({
  shipstationApi: vi.fn(),
}))

import { shipstationApi } from '../src/tools/shared/shipstation-api'
import execute from '../src/triggers/shipment-changed/shipment-changed.server'

const api = shipstationApi as unknown as ReturnType<typeof vi.fn>

const WATERMARK = '2026-09-01T00:00:00.000Z'

function shipment(id: string, modifiedAt: string, extra: Record<string, unknown> = {}) {
  return {
    shipment_id: id,
    shipment_number: `N-${id}`,
    shipment_status: 'label_purchased',
    store_id: 'se-store',
    modified_at: modifiedAt,
    created_at: modifiedAt,
    ship_to: { name: 'Ada Lovelace' },
    tags: [{ name: 'rush' }],
    ...extra,
  }
}

const polling = (state: Record<string, unknown> = {}) => ({
  state,
  connection: { value: 'test-api-key' },
})

/** The query object of the nth `shipstationApi` call. */
function queryOf(call: number): Record<string, unknown> {
  return api.mock.calls[call][2] as Record<string, unknown>
}

beforeEach(() => {
  api.mockReset()
})

describe('shipment-changed execute', () => {
  it('emits nothing and establishes a watermark on the first run', async () => {
    const before = Date.now()
    const result = await execute({}, polling())
    expect(result.events).toEqual([])
    expect(api).not.toHaveBeenCalled()
    const watermark = result.state.modifiedAtWatermark as string
    expect(Date.parse(watermark)).toBeGreaterThanOrEqual(before)
  })

  it('emits only what is newer than the watermark on a later run', async () => {
    api.mockResolvedValueOnce({
      // `modified_at_start` is inclusive, so the boundary row comes back.
      shipments: [
        shipment('se-1', WATERMARK),
        shipment('se-2', '2026-09-01T01:00:00.000Z'),
        shipment('se-3', '2026-09-01T02:00:00.000Z'),
      ],
      pages: 1,
    })

    const result = await execute({}, polling({ modifiedAtWatermark: WATERMARK }))

    expect(result.events.map((e) => e.shipmentId)).toEqual(['se-2', 'se-3'])
    expect(result.state.modifiedAtWatermark).toBe('2026-09-01T02:00:00.000Z')
  })

  it('queries the ascending modified_at delta with the panel filters', async () => {
    api.mockResolvedValueOnce({ shipments: [], pages: 1 })

    await execute(
      { storeId: ' se-store ', shipmentStatus: 'label_purchased', tag: 'rush' },
      polling({ modifiedAtWatermark: WATERMARK })
    )

    expect(api).toHaveBeenCalledTimes(1)
    expect(api.mock.calls[0][0]).toBe('/shipments')
    expect(queryOf(0)).toMatchObject({
      modified_at_start: WATERMARK,
      sort_by: 'modified_at',
      sort_dir: 'asc',
      page: 1,
      store_id: 'se-store',
      shipment_status: 'label_purchased',
      tag: 'rush',
    })
  })

  it('leaves the watermark untouched when the first page fails', async () => {
    api.mockRejectedValueOnce(new Error('upstream is down'))

    const result = await execute({}, polling({ modifiedAtWatermark: WATERMARK }))

    expect(result.events).toEqual([])
    expect(result.state.modifiedAtWatermark).toBe(WATERMARK)
  })

  it('keeps the events it read and does not skip past an unread page', async () => {
    api
      .mockResolvedValueOnce({
        shipments: [shipment('se-2', '2026-09-01T01:00:00.000Z')],
        pages: 3,
      })
      .mockRejectedValueOnce(new Error('upstream is down'))

    const result = await execute({}, polling({ modifiedAtWatermark: WATERMARK }))

    expect(result.events.map((e) => e.shipmentId)).toEqual(['se-2'])
    // Exactly as far as it actually read — the unread remainder is next poll's.
    expect(result.state.modifiedAtWatermark).toBe('2026-09-01T01:00:00.000Z')
  })

  it('stops at the page budget rather than looping', async () => {
    api.mockImplementation(async (_endpoint: string, _key: string, query: { page: number }) => ({
      shipments: [shipment(`se-${query.page}`, `2026-09-0${query.page}T00:00:00.000Z`)],
      pages: 99,
    }))

    const result = await execute({}, polling({ modifiedAtWatermark: WATERMARK }))

    expect(api).toHaveBeenCalledTimes(5)
    expect(result.events).toHaveLength(4)
  })

  it('projects the tags and ship-to name onto the event', async () => {
    api.mockResolvedValueOnce({
      shipments: [
        shipment('se-9', '2026-09-02T00:00:00.000Z', {
          tags: [{ name: 'rush' }, { name: 'gift' }],
        }),
      ],
      pages: 1,
    })

    const result = await execute({}, polling({ modifiedAtWatermark: WATERMARK }))

    expect(result.events[0]).toMatchObject({
      shipmentId: 'se-9',
      shipToName: 'Ada Lovelace',
      tags: 'rush, gift',
      isReturn: false,
    })
  })
})
