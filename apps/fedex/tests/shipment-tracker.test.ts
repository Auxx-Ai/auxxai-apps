// tests/shipment-tracker.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetStorage, __setConnection } from '@auxx/sdk/server'

// Mock the API layer so we can drive status sequences directly.
vi.mock('../src/tools/shared/fedex-api', () => ({
  trackByNumbers: vi.fn(),
  trackByReference: vi.fn(),
}))

import { trackByNumbers, trackByReference } from '../src/tools/shared/fedex-api'
import execute from '../src/triggers/shipment-tracker/shipment-tracker.server'

const mockTrack = trackByNumbers as unknown as ReturnType<typeof vi.fn>
const mockRef = trackByReference as unknown as ReturnType<typeof vi.fn>

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
  __setConnection({
    id: 'conn-1',
    type: 'secret',
    value: '',
    fields: { client_id: 'a', client_secret: 'b', account_number: '123456789' },
  })
  mockTrack.mockReset()
  mockRef.mockReset()
})

describe('shipment-tracker execute', () => {
  it('returns no events and skips the API when nothing is configured', async () => {
    const result = await execute({}, polling())
    expect(result.events).toEqual([])
    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('parses a comma/newline-separated list and dedupes', async () => {
    mockTrack.mockImplementation(async (infos: Array<{ trackingNumberInfo: { trackingNumber: string } }>) =>
      infos.map((i) => numberResult(i.trackingNumberInfo.trackingNumber, 'IT'))
    )
    await execute({ trackingNumbers: '111, 222\n111' }, polling())
    const sent = mockTrack.mock.calls[0][0].map(
      (i: { trackingNumberInfo: { trackingNumber: string } }) => i.trackingNumberInfo.trackingNumber
    )
    expect(sent).toEqual(['111', '222'])
  })

  it('seeds silently on first sighting', async () => {
    mockTrack.mockResolvedValueOnce([numberResult('111', 'IT')])
    const result = await execute({ trackingNumbers: '111' }, polling())
    expect(result.events).toEqual([])
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'in_transit' })
  })

  it('emits an event on a status change', async () => {
    mockTrack.mockResolvedValueOnce([numberResult('111', 'OD')])
    const result = await execute(
      { trackingNumbers: '111' },
      polling({ lastStatusByNumber: { '111': 'in_transit' } })
    )
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      trackingNumber: '111',
      previousStatus: 'in_transit',
      status: 'out_for_delivery',
      eventId: 'fedex-111-out_for_delivery-2026-06-12T00:00:00.000Z',
    })
  })

  it('respects the statusTypes filter but still advances state', async () => {
    mockTrack.mockResolvedValueOnce([numberResult('111', 'OD')])
    const result = await execute(
      { trackingNumbers: '111', statusTypes: ['delivered'] },
      polling({ lastStatusByNumber: { '111': 'in_transit' } })
    )
    expect(result.events).toEqual([])
    expect(result.state.lastStatusByNumber).toEqual({ '111': 'out_for_delivery' })
  })

  it('moves a delivered shipment to the terminal skip-set and stops tracking it', async () => {
    mockTrack.mockResolvedValueOnce([numberResult('111', 'DL')])
    const first = await execute(
      { trackingNumbers: '111' },
      polling({ lastStatusByNumber: { '111': 'out_for_delivery' } })
    )
    expect(first.events).toHaveLength(1)
    expect(first.events[0]).toMatchObject({ status: 'delivered', isDelivered: true })
    expect(first.state.terminal).toEqual(['111'])
    expect(first.state.lastStatusByNumber).toEqual({})

    // Next poll: terminal number is skipped — no API call.
    mockTrack.mockReset()
    const second = await execute({ trackingNumbers: '111' }, polling(first.state))
    expect(mockTrack).not.toHaveBeenCalled()
    expect(second.events).toEqual([])
  })

  it('expands a reference into tracking numbers', async () => {
    mockRef.mockResolvedValueOnce([numberResult('555', 'IT')])
    mockTrack.mockResolvedValueOnce([numberResult('555', 'IT')])
    await execute({ reference: 'PO-9' }, polling())
    expect(mockRef).toHaveBeenCalledTimes(1)
    const sent = mockTrack.mock.calls[0][0].map(
      (i: { trackingNumberInfo: { trackingNumber: string } }) => i.trackingNumberInfo.trackingNumber
    )
    expect(sent).toEqual(['555'])
  })

  it('chunks configured numbers into groups of 30', async () => {
    const numbers = Array.from({ length: 35 }, (_, i) => `n${i}`).join(',')
    mockTrack.mockImplementation(async (infos: Array<{ trackingNumberInfo: { trackingNumber: string } }>) =>
      infos.map((i) => numberResult(i.trackingNumberInfo.trackingNumber, 'IT'))
    )
    await execute({ trackingNumbers: numbers }, polling())
    expect(mockTrack).toHaveBeenCalledTimes(2)
    expect(mockTrack.mock.calls[0][0]).toHaveLength(30)
    expect(mockTrack.mock.calls[1][0]).toHaveLength(5)
  })

  it('tolerates a failing chunk and preserves its prior state', async () => {
    const numbers = Array.from({ length: 35 }, (_, i) => `n${i}`).join(',')
    mockTrack
      .mockRejectedValueOnce(new Error('FedEx 500'))
      .mockImplementationOnce(async (infos: Array<{ trackingNumberInfo: { trackingNumber: string } }>) =>
        infos.map((i) => numberResult(i.trackingNumberInfo.trackingNumber, 'IT'))
      )
    const prior = Object.fromEntries(Array.from({ length: 35 }, (_, i) => [`n${i}`, 'in_transit']))
    const result = await execute({ trackingNumbers: numbers }, polling({ lastStatusByNumber: prior }))
    expect(Object.keys(result.state.lastStatusByNumber as object)).toHaveLength(35)
  })
})
