// tests/shipment-status-changed.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetStorage, __setConnection } from '@auxx/sdk/server'

// Mock the API layer so we can drive status sequences directly.
vi.mock('../src/tools/shared/fedex-api', () => ({ trackByNumbers: vi.fn() }))

import { trackByNumbers } from '../src/tools/shared/fedex-api'
import execute from '../src/triggers/shipment-status-changed/shipment-status-changed.server'
import { addWatch, listWatches } from '../src/tools/shared/watches'

const mockTrack = trackByNumbers as unknown as ReturnType<typeof vi.fn>

function numberResult(trackingNumber: string, code: string) {
  return {
    trackingNumber,
    trackResults: [
      {
        latestStatusDetail: { derivedCode: code },
        scanEvents: [{ date: '2026-06-12T00:00:00Z', eventDescription: code, scanLocation: {} }],
      },
    ],
  }
}

const polling = (state: Record<string, unknown> = {}) => ({
  state,
  connection: { value: '', fields: { client_id: 'a', client_secret: 'b' } },
})

beforeEach(() => {
  __resetStorage()
  __setConnection({ id: 'conn-1', type: 'secret', value: '', fields: { client_id: 'a', client_secret: 'b' } })
  mockTrack.mockReset()
})

describe('shipment-status-changed execute', () => {
  it('returns no events when nothing is watched', async () => {
    const result = await execute({}, polling())
    expect(result.events).toEqual([])
    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('seeds silently on first sighting (no event, state recorded)', async () => {
    await addWatch('111', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    mockTrack.mockResolvedValueOnce([numberResult('111', 'IT')])

    const result = await execute({}, polling())
    expect(result.events).toEqual([])
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'in_transit' })
  })

  it('emits an event on a status change', async () => {
    await addWatch('111', { recordId: 'tkt1', watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    mockTrack.mockResolvedValueOnce([numberResult('111', 'OD')])

    const result = await execute({}, polling({ lastStatusByNumber: { '111': 'in_transit' } }))
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      trackingNumber: '111',
      previousStatus: 'in_transit',
      status: 'out_for_delivery',
      recordId: 'tkt1',
      eventId: 'fedex-111-out_for_delivery-2026-06-12T00:00:00.000Z',
    })
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'out_for_delivery' })
  })

  it('respects the statusTypes filter', async () => {
    await addWatch('111', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    mockTrack.mockResolvedValueOnce([numberResult('111', 'OD')])

    const result = await execute({ statusTypes: ['delivered'] }, polling({ lastStatusByNumber: { '111': 'in_transit' } }))
    expect(result.events).toEqual([])
    // State still advances so we don't re-fire later.
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'out_for_delivery' })
  })

  it('emits a final event and removes the watch on delivery', async () => {
    await addWatch('111', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'out_for_delivery' })
    mockTrack.mockResolvedValueOnce([numberResult('111', 'DL')])

    const result = await execute({}, polling({ lastStatusByNumber: { '111': 'out_for_delivery' } }))
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({ status: 'delivered', isDelivered: true })
    expect(await listWatches()).toHaveLength(0)
    expect(result.state.lastStatusByNumber).toEqual({})
  })

  it('chunks watches into groups of 30', async () => {
    for (let i = 0; i < 35; i++) {
      await addWatch(`n${i}`, { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    }
    mockTrack.mockImplementation(async (infos: Array<{ trackingNumberInfo: { trackingNumber: string } }>) =>
      infos.map((i) => numberResult(i.trackingNumberInfo.trackingNumber, 'IT'))
    )

    await execute({}, polling())
    expect(mockTrack).toHaveBeenCalledTimes(2)
    expect(mockTrack.mock.calls[0][0]).toHaveLength(30)
    expect(mockTrack.mock.calls[1][0]).toHaveLength(5)
  })

  it('tolerates a failing chunk and preserves its prior state', async () => {
    for (let i = 0; i < 35; i++) {
      await addWatch(`n${i}`, { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    }
    // First chunk throws; second resolves.
    mockTrack
      .mockRejectedValueOnce(new Error('FedEx 500'))
      .mockImplementationOnce(async (infos: Array<{ trackingNumberInfo: { trackingNumber: string } }>) =>
        infos.map((i) => numberResult(i.trackingNumberInfo.trackingNumber, 'IT'))
      )

    const prior = Object.fromEntries(Array.from({ length: 35 }, (_, i) => [`n${i}`, 'in_transit']))
    const result = await execute({}, polling({ lastStatusByNumber: prior }))
    // No throw; all 35 numbers retain a status (failed chunk preserved from prior state).
    expect(Object.keys(result.state.lastStatusByNumber as object)).toHaveLength(35)
  })

  it('drops stale numbers from state on rebuild', async () => {
    await addWatch('111', { watchedAt: '2026-06-12T00:00:00Z', lastKnownStatus: 'in_transit' })
    mockTrack.mockResolvedValueOnce([numberResult('111', 'IT')])

    const result = await execute({}, polling({ lastStatusByNumber: { '111': 'in_transit', gone: 'delivered' } }))
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'in_transit' })
  })
})
