// tests/shipment-status-changed.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetStorage, __setConnection } from '@auxx/sdk/server'

// Mock the API layer so we can drive status sequences directly.
vi.mock('../src/tools/shared/ups-api', () => ({ trackNumbersSettled: vi.fn() }))

import { trackNumbersSettled } from '../src/tools/shared/ups-api'
import execute from '../src/triggers/shipment-status-changed/shipment-status-changed.server'
import { addWatch, listWatches } from '../src/tools/shared/watches'

const mockTrack = trackNumbersSettled as unknown as ReturnType<typeof vi.fn>

function settled(trackingNumber: string, type: string) {
  return {
    trackingNumber,
    found: true,
    error: false,
    pkg: {
      currentStatus: { type, code: type },
      activity: [{ gmtDate: '20260612', gmtTime: '000000', status: { type }, location: { address: {} } }],
    },
  }
}

const errored = (trackingNumber: string) => ({ trackingNumber, found: false, error: true, pkg: null })

const polling = (state: Record<string, unknown> = {}) => ({
  state,
  connection: { value: 'tok', fields: {} },
})

beforeEach(() => {
  __resetStorage()
  __setConnection({ id: 'conn-1', type: 'oauth2-code', value: 'tok', fields: {} })
  mockTrack.mockReset()
})

describe('shipment-status-changed execute', () => {
  it('returns no events when nothing is watched', async () => {
    const result = await execute({}, polling())
    expect(result.events).toEqual([])
    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('seeds silently on first sighting (no event, state recorded)', async () => {
    await addWatch('1Z1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    mockTrack.mockResolvedValueOnce([settled('1Z1', 'I')])

    const result = await execute({}, polling())
    expect(result.events).toEqual([])
    expect(result.state.lastStatusByNumber).toEqual({ '1Z1': 'in_transit' })
  })

  it('emits an event on a status change', async () => {
    await addWatch('1Z1', {
      recordId: 'tkt1',
      watchedAt: '2026-06-12T00:00:00Z',
      lastKnownStatus: 'label_created',
    })
    mockTrack.mockResolvedValueOnce([settled('1Z1', 'I')])

    const result = await execute({}, polling({ lastStatusByNumber: { '1Z1': 'label_created' } }))
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      trackingNumber: '1Z1',
      previousStatus: 'label_created',
      status: 'in_transit',
      recordId: 'tkt1',
      eventId: 'ups-1Z1-in_transit-2026-06-12T00:00:00.000Z',
    })
    expect(result.state.lastStatusByNumber).toEqual({ '1Z1': 'in_transit' })
  })

  it('respects the statusTypes filter', async () => {
    await addWatch('1Z1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'label_created' })
    mockTrack.mockResolvedValueOnce([settled('1Z1', 'I')])

    const result = await execute(
      { statusTypes: ['delivered'] },
      polling({ lastStatusByNumber: { '1Z1': 'label_created' } })
    )
    expect(result.events).toEqual([])
    // State still advances so we don't re-fire later.
    expect(result.state.lastStatusByNumber).toEqual({ '1Z1': 'in_transit' })
  })

  it('emits a final event and removes the watch on delivery', async () => {
    await addWatch('1Z1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    mockTrack.mockResolvedValueOnce([settled('1Z1', 'D')])

    const result = await execute({}, polling({ lastStatusByNumber: { '1Z1': 'in_transit' } }))
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({ status: 'delivered', isDelivered: true })
    expect(await listWatches()).toHaveLength(0)
    expect(result.state.lastStatusByNumber).toEqual({})
  })

  it('tolerates an errored number and preserves its prior state', async () => {
    await addWatch('OK', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    await addWatch('BAD', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    mockTrack.mockResolvedValueOnce([settled('OK', 'I'), errored('BAD')])

    const result = await execute(
      {},
      polling({ lastStatusByNumber: { OK: 'in_transit', BAD: 'picked_up' } })
    )
    expect(result.events).toEqual([])
    expect(result.state.lastStatusByNumber).toEqual({ OK: 'in_transit', BAD: 'picked_up' })
  })

  it('drops stale numbers from state on rebuild', async () => {
    await addWatch('1Z1', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    mockTrack.mockResolvedValueOnce([settled('1Z1', 'I')])

    const result = await execute(
      {},
      polling({ lastStatusByNumber: { '1Z1': 'in_transit', gone: 'delivered' } })
    )
    expect(result.state.lastStatusByNumber).toEqual({ '1Z1': 'in_transit' })
  })
})
