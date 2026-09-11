// tests/tracking-get.test.ts

/**
 * `tracking.get`: the query it builds and the shape it publishes.
 *
 * This is the block's per-parcel truth, so the assertions are about the two
 * things that can silently be wrong: which carrier parameter reaches
 * ShipStation, and whether a status survives the projection intact.
 *
 * `fetch` is stubbed and the connection is mocked, so the exact request the
 * executor builds is the assertion.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/tools/shared/connection', () => ({
  getShipstationApiKey: () => 'test-api-key',
}))

import { InvalidInputError } from '@auxx/sdk/server'
import {
  TRACKING_STATUS_LABELS,
  buildTrackingQuery,
  executeTracking,
  projectTracking,
} from '../src/blocks/shipstation/resources/tracking/tracking-execute.server'

const fetchMock = vi.fn()

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function requestedUrl(): URL {
  expect(fetchMock).toHaveBeenCalledTimes(1)
  return new URL(fetchMock.mock.calls[0][0] as string)
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildTrackingQuery', () => {
  it('sends carrier_code and tracking_number in code mode', () => {
    expect(
      buildTrackingQuery({
        trackingGetTrackingNumber: '9400111899223197428490',
        trackingGetCarrierBy: 'code',
        trackingGetCarrierCode: 'usps',
      })
    ).toEqual({ tracking_number: '9400111899223197428490', carrier_code: 'usps' })
  })

  it('sends carrier_id instead when the author picked a connected carrier', () => {
    expect(
      buildTrackingQuery({
        trackingGetTrackingNumber: '1Z999',
        trackingGetCarrierBy: 'id',
        trackingGetCarrierId: 'se-3891090',
      })
    ).toEqual({ tracking_number: '1Z999', carrier_id: 'se-3891090' })
  })

  it('never sends both carrier parameters at once', () => {
    const query = buildTrackingQuery({
      trackingGetTrackingNumber: '1Z999',
      trackingGetCarrierBy: 'id',
      trackingGetCarrierId: 'se-3891090',
      trackingGetCarrierCode: 'ups',
    })
    expect(query.carrier_code).toBeUndefined()
    expect(query.carrier_id).toBe('se-3891090')
  })

  it('falls back to whichever side is actually filled in', () => {
    // A workflow built in code mode and later rebound to a carrier id keeps
    // working rather than failing with an empty parameter.
    expect(
      buildTrackingQuery({
        trackingGetTrackingNumber: '1Z999',
        trackingGetCarrierBy: 'code',
        trackingGetCarrierCode: '',
        trackingGetCarrierId: 'se-3891090',
      })
    ).toEqual({ tracking_number: '1Z999', carrier_id: 'se-3891090' })
  })

  it('trims the tracking number, because a pasted one carries whitespace', () => {
    const query = buildTrackingQuery({
      trackingGetTrackingNumber: '  1Z999  ',
      trackingGetCarrierCode: 'ups',
    })
    expect(query.tracking_number).toBe('1Z999')
  })

  it('refuses a lookup with no tracking number', () => {
    expect(() => buildTrackingQuery({ trackingGetCarrierCode: 'usps' })).toThrow(InvalidInputError)
    expect(() => buildTrackingQuery({ trackingGetCarrierCode: 'usps' })).toThrow(
      /tracking number is required/
    )
  })

  it('refuses a lookup with no carrier at all', () => {
    // ShipStation cannot resolve a bare number: the same digits mean different
    // parcels at different carriers.
    expect(() => buildTrackingQuery({ trackingGetTrackingNumber: '1Z999' })).toThrow(
      InvalidInputError
    )
    expect(() => buildTrackingQuery({ trackingGetTrackingNumber: '1Z999' })).toThrow(
      /carrier is required/
    )
  })
})

describe('executeTracking', () => {
  it('GETs /v2/tracking with the carrier code', async () => {
    fetchMock.mockResolvedValue(json({ tracking_number: '1Z999', status_code: 'IT' }))

    await executeTracking('get', {
      trackingGetTrackingNumber: '1Z999',
      trackingGetCarrierBy: 'code',
      trackingGetCarrierCode: 'ups',
    })

    const url = requestedUrl()
    expect(url.pathname).toBe('/v2/tracking')
    expect(url.searchParams.get('carrier_code')).toBe('ups')
    expect(url.searchParams.get('tracking_number')).toBe('1Z999')
    expect(url.searchParams.get('carrier_id')).toBeNull()
  })

  it('GETs /v2/tracking with the carrier id alternative', async () => {
    fetchMock.mockResolvedValue(json({ tracking_number: '1Z999', status_code: 'DE' }))

    await executeTracking('get', {
      trackingGetTrackingNumber: '1Z999',
      trackingGetCarrierBy: 'id',
      trackingGetCarrierId: 'se-3891090',
    })

    const url = requestedUrl()
    expect(url.searchParams.get('carrier_id')).toBe('se-3891090')
    expect(url.searchParams.get('carrier_code')).toBeNull()
  })

  it('never calls the provider when the input cannot name a parcel', async () => {
    await expect(executeTracking('get', {})).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses an operation the resource does not have', async () => {
    await expect(executeTracking('start', { trackingGetTrackingNumber: '1Z999' })).rejects.toThrow(
      /Unknown tracking operation/
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('projectTracking', () => {
  const response = {
    tracking_number: '9400111899223197428490',
    tracking_url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490',
    status_code: 'IT',
    status_description: 'In Transit',
    status_detail_code: 'HUB_SCAN_OUT',
    status_detail_description: 'Departed hub',
    carrier_code: 'usps',
    carrier_id: 3891089,
    carrier_status_code: '03',
    carrier_status_description: 'Shipment information sent to USPS',
    carrier_detail_code: 'ACCEPT',
    ship_date: '2026-09-08T00:00:00Z',
    estimated_delivery_date: '2026-09-12T00:00:00Z',
    events: [
      {
        occurred_at: '2026-09-08T14:02:00Z',
        carrier_occurred_at: '2026-09-08T09:02:00',
        description: 'Accepted at USPS Origin Facility',
        status_code: 'AC',
        status_description: 'Accepted',
        carrier_status_code: '03',
        carrier_status_description: 'Acceptance',
        city_locality: 'Austin',
        state_province: 'TX',
        postal_code: '78756',
        country_code: 'US',
        latitude: 30.3,
        longitude: -97.7,
      },
      {
        occurred_at: '2026-09-09T02:10:00Z',
        description: 'Departed USPS Regional Facility',
        status_code: 'IT',
        status_description: 'In Transit',
        carrier_status_code: '10',
        carrier_status_description: 'Departed',
        city_locality: 'Dallas',
        state_province: 'TX',
        postal_code: '75260',
        country_code: 'US',
      },
    ],
  }

  it('carries the status, the carrier status and both delivery dates through', () => {
    const result = projectTracking(response)

    expect(result.tracking.trackingNumber).toBe('9400111899223197428490')
    expect(result.tracking.statusCode).toBe('IT')
    expect(result.tracking.statusLabel).toBe('In Transit')
    expect(result.tracking.statusDescription).toBe('In Transit')
    expect(result.tracking.statusDetailCode).toBe('HUB_SCAN_OUT')
    expect(result.tracking.carrierStatusDescription).toBe('Shipment information sent to USPS')
    expect(result.tracking.estimatedDeliveryDate).toBe('2026-09-12T00:00:00Z')
    expect(result.tracking.actualDeliveryDate).toBe('')
  })

  it('stringifies the numeric carrier id ShipStation returns here', () => {
    // `carrier_id` is an int32 on the tracking response and a `se-` string
    // everywhere else in V2. Downstream nodes see one type.
    expect(projectTracking(response).tracking.carrierId).toBe('3891089')
  })

  it('keeps the events oldest first, exactly as the carrier reported them', () => {
    const result = projectTracking(response)
    expect(result.eventCount).toBe(2)
    expect(result.events.map((event) => event.statusCode)).toEqual(['AC', 'IT'])
    expect(result.events[0].cityLocality).toBe('Austin')
    expect(result.events[0].statusLabel).toBe('Accepted')
    expect(result.events[1].statusLabel).toBe('In Transit')
  })

  it('derives delivered from the status code, not from a delivery date', () => {
    const delivered = projectTracking({ ...response, status_code: 'DE' })
    expect(delivered.delivered).toBe(true)
    expect(delivered.tracking.delivered).toBe(true)
    expect(delivered.tracking.terminal).toBe(true)

    // A returned parcel can still carry a delivery date from the outbound leg.
    const returned = projectTracking({
      status_code: 'EX',
      status_detail_code: 'RETURN_TO_SENDER',
      actual_delivery_date: '2026-09-11T00:00:00Z',
    })
    expect(returned.delivered).toBe(false)
    expect(returned.tracking.exception).toBe(true)
    expect(returned.tracking.terminal).toBe(false)
  })

  it('treats a collection-point delivery as terminal but not as delivered', () => {
    const result = projectTracking({ status_code: 'SP' })
    expect(result.tracking.terminal).toBe(true)
    expect(result.delivered).toBe(false)
    expect(result.tracking.statusLabel).toBe('Delivered To Collection Location')
  })

  it('survives a response with nothing in it, which is what a bad number returns', () => {
    const result = projectTracking(undefined)
    expect(result.tracking.statusCode).toBe('')
    expect(result.tracking.statusLabel).toBe('')
    expect(result.events).toEqual([])
    expect(result.eventCount).toBe(0)
    expect(result.delivered).toBe(false)
  })

  it('labels every status code the V2 enum documents', () => {
    expect(Object.keys(TRACKING_STATUS_LABELS).sort()).toEqual([
      'AC',
      'AT',
      'DE',
      'EX',
      'IT',
      'NY',
      'SP',
      'UN',
    ])
  })
})
