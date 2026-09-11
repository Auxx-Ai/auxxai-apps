// tests/agent-tools-tracking.test.ts

/**
 * `get_shipstation_tracking`: the request it builds, the status projection, and
 * the event ordering.
 *
 * The shared client is mocked rather than `fetch`, so nothing here can reach
 * the network and the assertion is the exact call the tool makes.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/tools/shared/shipstation-api', () => ({ shipstationApi: vi.fn() }))
vi.mock('../src/tools/shared/connection', () => ({
  getShipstationApiKey: () => 'test-api-key',
}))

import { shipstationApi } from '../src/tools/shared/shipstation-api'
import getShipstationTracking from '../src/tools/get-shipstation-tracking.tool.server'

const api = shipstationApi as unknown as ReturnType<typeof vi.fn>

function event(occurredAt: string, overrides: Record<string, unknown> = {}) {
  return {
    occurred_at: occurredAt,
    status_code: 'IT',
    status_description: 'In Transit',
    carrier_status_code: 'DP',
    carrier_status_description: 'Departed FedEx location',
    city_locality: 'Memphis',
    state_province: 'TN',
    postal_code: '38118',
    country_code: 'US',
    ...overrides,
  }
}

beforeEach(() => {
  api.mockReset()
})

describe('the request', () => {
  it('looks up one number by carrier code', async () => {
    api.mockResolvedValue({ tracking_number: 'TRACK-1', status_code: 'IT', events: [] })

    await getShipstationTracking({ trackingNumber: 'TRACK-1', carrierCode: 'fedex' })

    expect(api).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith('/tracking', 'test-api-key', {
      tracking_number: 'TRACK-1',
      carrier_code: 'fedex',
      carrier_id: undefined,
    })
  })

  it('accepts a carrier id instead of a code', async () => {
    api.mockResolvedValue({ tracking_number: 'TRACK-1', status_code: 'IT', events: [] })

    await getShipstationTracking({ trackingNumber: 'TRACK-1', carrierId: 'se-3891373' })

    expect(api).toHaveBeenCalledWith('/tracking', 'test-api-key', {
      tracking_number: 'TRACK-1',
      carrier_code: undefined,
      carrier_id: 'se-3891373',
    })
  })

  it('refuses a bare tracking number rather than guessing a carrier', async () => {
    // The load-bearing assertion is the second one: the refusal happens before
    // any request. Neither the error class nor its message is asserted, because
    // the SDK's error classes reach these tests through the built `lib/`, and
    // `pnpm build` in the SDK strips those implementations to stubs — an
    // assertion that flips whenever someone rebuilds the SDK tests the tree,
    // not this tool.
    await expect(getShipstationTracking({ trackingNumber: 'TRACK-1' })).rejects.toThrow()
    expect(api).not.toHaveBeenCalled()
  })
})

describe('the projection', () => {
  it('spells out the status code and derives the lifecycle flags', async () => {
    api.mockResolvedValue({
      tracking_number: 'TRACK-1',
      carrier_code: 'fedex',
      status_code: 'DE',
      status_description: 'Delivered',
      actual_delivery_date: '2026-09-12T18:04:00Z',
      events: [event('2026-09-12T18:04:00Z', { status_code: 'DE', signer: 'D WHITFIELD' })],
    })

    const result = await getShipstationTracking({
      trackingNumber: 'TRACK-1',
      carrierCode: 'fedex',
    })

    expect(result.status).toBe('delivered')
    expect(result.statusCode).toBe('DE')
    expect(result.delivered).toBe(true)
    expect(result.inTransit).toBe(false)
    expect(result.exception).toBe(false)
    expect(result.events[0]?.signer).toBe('D WHITFIELD')
    expect(result.summary).toContain('Delivered')
  })

  it('reports a not-yet-in-system parcel as such, which is the case a label status hides', async () => {
    api.mockResolvedValue({
      tracking_number: 'TRACK-1',
      status_code: 'NY',
      status_description: 'Not Yet In System',
      events: [],
    })

    const result = await getShipstationTracking({
      trackingNumber: 'TRACK-1',
      carrierCode: 'fedex',
    })

    expect(result.status).toBe('not_yet_in_system')
    expect(result.delivered).toBe(false)
    expect(result.inTransit).toBe(false)
    expect(result.eventCount).toBe(0)
    expect(result.summary).toContain('no scans yet')
  })

  it('orders scans newest first whatever order the carrier sent them in', async () => {
    api.mockResolvedValue({
      tracking_number: 'TRACK-1',
      status_code: 'IT',
      events: [
        event('2026-09-10T01:00:00Z'),
        event('2026-09-12T01:00:00Z'),
        event('2026-09-11T01:00:00Z'),
      ],
    })

    const result = await getShipstationTracking({
      trackingNumber: 'TRACK-1',
      carrierCode: 'fedex',
    })

    expect(result.events.map((e) => e.occurredAt)).toEqual([
      '2026-09-12T01:00:00Z',
      '2026-09-11T01:00:00Z',
      '2026-09-10T01:00:00Z',
    ])
    expect(result.eventsTruncated).toBe(false)
  })

  it('caps a pathological scan history and says it did', async () => {
    api.mockResolvedValue({
      tracking_number: 'TRACK-1',
      status_code: 'IT',
      events: Array.from({ length: 45 }, (_, i) =>
        event(`2026-09-${String((i % 28) + 1).padStart(2, '0')}T01:00:00Z`)
      ),
    })

    const result = await getShipstationTracking({
      trackingNumber: 'TRACK-1',
      carrierCode: 'fedex',
    })

    expect(result.events).toHaveLength(40)
    expect(result.eventCount).toBe(45)
    expect(result.eventsTruncated).toBe(true)
  })
})
