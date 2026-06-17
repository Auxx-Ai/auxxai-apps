// tests/shipment-tracker.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the API layer so we can drive status sequences directly. `trackNumbersSettled`
// is already per-number error tolerant, so the tracker needs no chunking of its own.
vi.mock('../src/tools/shared/ups-api', () => ({
  trackNumbersSettled: vi.fn(),
}))

import { trackNumbersSettled } from '../src/tools/shared/ups-api'
import execute from '../src/triggers/shipment-tracker/shipment-tracker.server'

const mockTrack = trackNumbersSettled as unknown as ReturnType<typeof vi.fn>

/** A settled track result whose raw package maps to the given UPS status `type`. */
function settled(trackingNumber: string, type: string, opts: { error?: boolean } = {}) {
  if (opts.error) return { trackingNumber, found: false, pkg: null, error: true }
  return {
    trackingNumber,
    found: true,
    error: false,
    pkg: {
      currentStatus: { type, code: type, description: type },
      activity: [{ gmtDate: '20260612', gmtTime: '000000', status: { type, description: type } }],
    },
  }
}

const polling = (state: Record<string, unknown> = {}) => ({ state })

beforeEach(() => {
  mockTrack.mockReset()
})

describe('shipment-tracker execute', () => {
  it('returns no events and skips the API when nothing is configured', async () => {
    const result = await execute({}, polling())
    expect(result.events).toEqual([])
    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('parses a comma/newline-separated list and dedupes', async () => {
    mockTrack.mockImplementation(async (numbers: string[]) => numbers.map((n) => settled(n, 'I')))
    await execute({ trackingNumbers: '111, 222\n111' }, polling())
    expect(mockTrack.mock.calls[0][0]).toEqual(['111', '222'])
  })

  it('seeds silently on first sighting', async () => {
    mockTrack.mockResolvedValueOnce([settled('111', 'I')])
    const result = await execute({ trackingNumbers: '111' }, polling())
    expect(result.events).toEqual([])
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'in_transit' })
  })

  it('emits an event on a status change', async () => {
    mockTrack.mockResolvedValueOnce([settled('111', 'D')])
    const result = await execute(
      { trackingNumbers: '111' },
      polling({ lastStatusByNumber: { '111': 'in_transit' } })
    )
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      trackingNumber: '111',
      previousStatus: 'in_transit',
      status: 'delivered',
      isDelivered: true,
      eventId: 'ups-111-delivered-2026-06-12T00:00:00.000Z',
    })
  })

  it('respects the statusTypes filter but still advances state', async () => {
    mockTrack.mockResolvedValueOnce([settled('111', 'X')])
    const result = await execute(
      { trackingNumbers: '111', statusTypes: ['delivered'] },
      polling({ lastStatusByNumber: { '111': 'in_transit' } })
    )
    expect(result.events).toEqual([])
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'exception' })
  })

  it('moves a delivered shipment to the terminal skip-set and stops tracking it', async () => {
    mockTrack.mockResolvedValueOnce([settled('111', 'D')])
    const first = await execute(
      { trackingNumbers: '111' },
      polling({ lastStatusByNumber: { '111': 'in_transit' } })
    )
    expect(first.events).toHaveLength(1)
    expect(first.state.terminal).toEqual(['111'])
    expect(first.state.lastStatusByNumber).toEqual({})

    // Next poll: terminal number is skipped — no API call.
    mockTrack.mockReset()
    const second = await execute({ trackingNumbers: '111' }, polling(first.state))
    expect(mockTrack).not.toHaveBeenCalled()
    expect(second.events).toEqual([])
  })

  it('tolerates a per-number error and preserves its prior state', async () => {
    mockTrack.mockResolvedValueOnce([settled('111', 'I', { error: true }), settled('222', 'D')])
    const result = await execute(
      { trackingNumbers: '111,222' },
      polling({ lastStatusByNumber: { '111': 'in_transit', '222': 'in_transit' } })
    )
    // 111 errored → keeps prior status, no event; 222 advanced to delivered (terminal).
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'in_transit' })
    expect(result.state.terminal).toEqual(['222'])
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({ trackingNumber: '222', status: 'delivered' })
  })
})
