// tests/fulfillment-get-many.test.ts

/**
 * `fulfillment.getMany`, the only list in this block that matches a CHILD box's
 * tracking number.
 *
 * The query builder gets its own tests because ShipStation ANDs its filters: an
 * unset input sent as `tracking_number=` is a filter for the empty tracking
 * number, which silently returns nothing, rather than no filter at all.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildFulfillmentQuery,
  executeFulfillment,
} from '../src/blocks/shipstation/resources/fulfillment/fulfillment-execute.server'

vi.mock('../src/tools/shared/connection', () => ({
  getShipstationApiKey: () => 'test-api-key',
}))

const fetchMock = vi.fn()

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildFulfillmentQuery', () => {
  it('is empty when nothing is set', () => {
    expect(buildFulfillmentQuery({})).toEqual({})
    expect(buildFulfillmentQuery(undefined)).toEqual({})
  })

  it('sends only the filters the author set', () => {
    expect(
      buildFulfillmentQuery({
        fulfillmentGetManyTrackingNumber: '770000000001',
        fulfillmentGetManyShipmentId: '',
        fulfillmentGetManyShipToName: '   ',
        fulfillmentGetManyBatchId: undefined,
      })
    ).toEqual({ tracking_number: '770000000001' })
  })

  it('maps every exposed filter onto its ShipStation parameter', () => {
    expect(
      buildFulfillmentQuery({
        fulfillmentGetManyTrackingNumber: 't1',
        fulfillmentGetManyShipmentId: 'se-1',
        fulfillmentGetManyFulfillmentId: 'f-1',
        fulfillmentGetManyShipmentNumber: '1005',
        fulfillmentGetManyBatchId: 'b-1',
        fulfillmentGetManyOrderSourceId: 'store-1',
        fulfillmentGetManyShipToName: 'Jane Smith',
        fulfillmentGetManyShipDateStart: '2026-09-01T00:00:00Z',
        fulfillmentGetManyShipDateEnd: '2026-09-30T00:00:00Z',
        fulfillmentGetManyCreateDateStart: '2026-08-01T00:00:00Z',
        fulfillmentGetManyCreateDateEnd: '2026-08-31T00:00:00Z',
        fulfillmentGetManyPage: 2,
        fulfillmentGetManyPageSize: 100,
        fulfillmentGetManySortBy: 'modified_at',
        fulfillmentGetManySortDir: 'desc',
      })
    ).toEqual({
      tracking_number: 't1',
      shipment_id: 'se-1',
      fulfillment_id: 'f-1',
      shipment_number: '1005',
      batch_id: 'b-1',
      order_source_id: 'store-1',
      ship_to_name: 'Jane Smith',
      ship_date_start: '2026-09-01T00:00:00Z',
      ship_date_end: '2026-09-30T00:00:00Z',
      create_date_start: '2026-08-01T00:00:00Z',
      create_date_end: '2026-08-31T00:00:00Z',
      page: 2,
      page_size: 100,
      sort_by: 'modified_at',
      sort_dir: 'desc',
    })
  })

  it('omits the sort when it is left on the panel default', () => {
    const query = buildFulfillmentQuery({
      fulfillmentGetManySortBy: '',
      fulfillmentGetManySortDir: '',
    })

    // Absent means "whatever ShipStation defaults to", which is the honest
    // reading of a select whose first option is labelled Default.
    expect(query).toEqual({})
  })

  it('drops a page number that is not a usable integer', () => {
    expect(buildFulfillmentQuery({ fulfillmentGetManyPage: 0 })).toEqual({})
    expect(buildFulfillmentQuery({ fulfillmentGetManyPage: 'first' })).toEqual({})
    expect(buildFulfillmentQuery({ fulfillmentGetManyPage: '3' })).toEqual({ page: 3 })
  })
})

describe('executeFulfillment', () => {
  it('sends the query to /v2/fulfillments', async () => {
    fetchMock.mockResolvedValue(json({ fulfillments: [] }))

    await executeFulfillment('getMany', { fulfillmentGetManyTrackingNumber: '770000000001' })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.pathname).toBe('/v2/fulfillments')
    expect(url.searchParams.get('tracking_number')).toBe('770000000001')
    expect([...url.searchParams.keys()]).toEqual(['tracking_number'])
  })

  it('projects a fulfillment and flattens its ship-to', async () => {
    fetchMock.mockResolvedValue(
      json({
        fulfillments: [
          {
            fulfillment_id: 'f-1',
            shipment_id: 'se-428778294',
            shipment_number: '1005',
            tracking_number: '770000000001',
            created_at: '2026-09-10T07:00:00.000Z',
            ship_date: '2026-09-10T07:00:00Z',
            delivered_at: null,
            voided_at: null,
            voided: false,
            void_requested: false,
            order_source_notified: true,
            fulfillment_carrier_friendly_name: 'FedEx',
            fulfillment_provider_code: null,
            fulfillment_service_code: 'fedex_home_delivery',
            fulfillment_fee: { currency: 'usd', amount: 12.5 },
            ship_to: {
              name: 'Jane Smith',
              city_locality: 'Burbank',
              state_province: 'CA',
              postal_code: '91521',
              country_code: 'US',
            },
          },
        ],
        page: 1,
        pages: 1,
        total: 1,
      })
    )

    const result = await executeFulfillment('getMany', {})

    expect(result.fulfillments).toEqual([
      {
        fulfillmentId: 'f-1',
        shipmentId: 'se-428778294',
        shipmentNumber: '1005',
        trackingNumber: '770000000001',
        carrierFriendlyName: 'FedEx',
        fulfillmentProviderCode: '',
        fulfillmentServiceCode: 'fedex_home_delivery',
        createdAt: '2026-09-10T07:00:00.000Z',
        shipDate: '2026-09-10T07:00:00Z',
        deliveredAt: '',
        voidedAt: '',
        voided: false,
        voidRequested: false,
        orderSourceNotified: true,
        feeAmount: 12.5,
        feeCurrency: 'usd',
        shipToName: 'Jane Smith',
        shipToCity: 'Burbank',
        shipToState: 'CA',
        shipToPostalCode: '91521',
        shipToCountry: 'US',
      },
    ])
    expect(result.count).toBe(1)
    expect(result.total).toBe(1)
  })

  it('survives a row with no ship-to and no fee', async () => {
    fetchMock.mockResolvedValue(json({ fulfillments: [{ fulfillment_id: 'f-2' }] }))

    const result = await executeFulfillment('getMany', {})

    expect(result.fulfillments[0].shipToName).toBe('')
    expect(result.fulfillments[0].feeAmount).toBe(0)
    expect(result.fulfillments[0].feeCurrency).toBe('')
  })

  it('refuses an unknown operation by name', async () => {
    await expect(executeFulfillment('get', {})).rejects.toThrow(
      'Unknown fulfillment operation: get'
    )
  })
})
