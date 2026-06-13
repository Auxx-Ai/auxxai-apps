// tests/map-shipment.test.ts

import { describe, expect, it } from 'vitest'
import { mapShipment, selectTrackResult } from '../src/tools/shared/map-shipment'
import type { RawTrackResult } from '../src/tools/shared/fedex-api'

function trackResult(over: Partial<RawTrackResult> = {}): RawTrackResult {
  return {
    latestStatusDetail: {
      code: 'IT',
      derivedCode: 'IT',
      statusByLocale: 'In transit',
      description: 'In transit',
      scanLocation: { city: 'Memphis', stateOrProvinceCode: 'TN', countryCode: 'US' },
    },
    ...over,
  }
}

describe('status mapping', () => {
  const cases: Array<[string, string]> = [
    ['OC', 'label_created'],
    ['PU', 'picked_up'],
    ['AR', 'in_transit'],
    ['DP', 'in_transit'],
    ['IT', 'in_transit'],
    ['AO', 'in_transit'],
    ['CC', 'in_transit'],
    ['OD', 'out_for_delivery'],
    ['DL', 'delivered'],
    ['DE', 'exception'],
    ['SE', 'exception'],
    ['CD', 'exception'],
    ['DY', 'exception'],
    ['RS', 'returned_to_shipper'],
  ]
  it.each(cases)('maps %s → %s', (code, expected) => {
    const { shipment } = mapShipment('1', [trackResult({ latestStatusDetail: { derivedCode: code } })])
    expect(shipment?.statusType).toBe(expected)
  })

  it('falls back to unknown for an unrecognized code, keeping the raw code', () => {
    const { shipment } = mapShipment('1', [trackResult({ latestStatusDetail: { derivedCode: 'ZZ' } })])
    expect(shipment?.statusType).toBe('unknown')
    expect(shipment?.statusCode).toBe('ZZ')
  })

  it('prefers derivedCode over code', () => {
    const { shipment } = mapShipment('1', [
      trackResult({ latestStatusDetail: { code: 'IT', derivedCode: 'DL' } }),
    ])
    expect(shipment?.statusType).toBe('delivered')
  })
})

describe('not found', () => {
  it('returns found:false when the only result is an error', () => {
    const res = mapShipment('1', [{ error: { code: 'TRACKING.TRACKINGNO.NOTFOUND' } }])
    expect(res).toEqual({ found: false, shipment: null })
  })

  it('returns found:false for an empty result set', () => {
    expect(mapShipment('1', [])).toEqual({ found: false, shipment: null })
  })
})

describe('field mapping', () => {
  it('normalizes mixed offset and Z timestamps to UTC ISO', () => {
    const { shipment } = mapShipment('1', [
      trackResult({
        scanEvents: [
          { date: '2026-06-11T14:32:00-05:00', eventDescription: 'a', scanLocation: {} },
          { date: '2026-06-10T09:00:00Z', eventDescription: 'b', scanLocation: {} },
        ],
      }),
    ])
    expect(shipment?.scanEvents[0].date).toBe('2026-06-11T19:32:00.000Z')
    expect(shipment?.scanEvents[1].date).toBe('2026-06-10T09:00:00.000Z')
  })

  it('sorts scan events newest-first and caps at 20', () => {
    const scanEvents = Array.from({ length: 25 }, (_, i) => ({
      date: `2026-06-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
      eventDescription: `e${i}`,
      scanLocation: {},
    }))
    const { shipment } = mapShipment('1', [trackResult({ scanEvents })])
    expect(shipment?.scanEvents).toHaveLength(20)
    const dates = shipment?.scanEvents.map((e) => e.date ?? '') ?? []
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('sets isDelayed when any scan reports DELAYED', () => {
    const { shipment } = mapShipment('1', [
      trackResult({
        scanEvents: [
          { date: '2026-06-11T00:00:00Z', eventDescription: 'x', delayDetail: { status: 'DELAYED' } },
        ],
      }),
    ])
    expect(shipment?.isDelayed).toBe(true)
  })

  it('extracts EDD window, deliveredAt, service and receivedByName', () => {
    const { shipment } = mapShipment('1', [
      trackResult({
        latestStatusDetail: { derivedCode: 'DL', statusByLocale: 'Delivered' },
        estimatedDeliveryTimeWindow: {
          window: { begins: '2026-06-11T16:00:00Z', ends: '2026-06-11T20:00:00Z' },
        },
        dateAndTimes: [{ type: 'ACTUAL_DELIVERY', dateTime: '2026-06-11T19:32:00Z' }],
        serviceDetail: { description: 'FedEx Ground' },
        deliveryDetails: { receivedByName: 'J.COOPER' },
      }),
    ])
    expect(shipment?.estimatedDeliveryWindow).toEqual({
      begins: '2026-06-11T16:00:00.000Z',
      ends: '2026-06-11T20:00:00.000Z',
    })
    expect(shipment?.estimatedDelivery).toBe('2026-06-11T16:00:00.000Z')
    expect(shipment?.deliveredAt).toBe('2026-06-11T19:32:00.000Z')
    expect(shipment?.service).toBe('FedEx Ground')
    expect(shipment?.receivedByName).toBe('J.COOPER')
  })
})

describe('selectTrackResult (reused numbers)', () => {
  it('picks the result with the most recent ship date', () => {
    const older = trackResult({
      latestStatusDetail: { derivedCode: 'DL' },
      dateAndTimes: [{ type: 'SHIP', dateTime: '2025-01-01T00:00:00Z' }],
    })
    const newer = trackResult({
      latestStatusDetail: { derivedCode: 'IT' },
      dateAndTimes: [{ type: 'SHIP', dateTime: '2026-06-01T00:00:00Z' }],
    })
    expect(selectTrackResult([older, newer])).toBe(newer)
    const { shipment } = mapShipment('1', [older, newer])
    expect(shipment?.statusType).toBe('in_transit')
  })
})
