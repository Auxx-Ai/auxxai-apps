// tests/label-execute.test.ts

/**
 * The `label` resource executor: which endpoint each operation reaches, with
 * which method and body.
 *
 * `fetch` is stubbed and the real `shipstationApi` client runs, so the
 * assertion is the exact request that would go to ShipStation. That matters
 * most for `label.create`, which is ONE block operation fanning out to THREE
 * endpoints: a mode select that silently routed to the wrong one would buy the
 * wrong label, and nothing downstream would notice.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InvalidInputError } from '@auxx/sdk/server'
import { executeLabel } from '../src/blocks/shipstation/resources/label/label-execute.server'

vi.mock('../src/tools/shared/connection', () => ({
  getShipstationApiKey: () => 'test-api-key',
}))

const fetchMock = vi.fn()

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** The single request the stub received, as `[url, init]`. */
function lastCall(): [string, RequestInit] {
  expect(fetchMock).toHaveBeenCalledTimes(1)
  return fetchMock.mock.calls[0] as [string, RequestInit]
}

function body(): any {
  const [, init] = lastCall()
  return JSON.parse(String(init.body))
}

/** A minimal single-box label, enough for the projector. */
const oneBoxLabel = {
  label_id: 'se-1',
  status: 'completed',
  shipment_id: 'se-ship-1',
  carrier_code: 'ups',
  service_code: 'ups_ground',
  tracking_number: '1ZAAA',
  packages: [{ package_id: 1, sequence: 1, tracking_number: '1ZAAA' }],
}

/** A complete scratch-mode input, so a test can vary one field at a time. */
function scratchInput(overrides: Record<string, any> = {}) {
  return {
    labelCreateFrom: 'scratch',
    labelCreateCarrierId: 'se-carrier-1',
    labelCreateServiceCode: 'ups_ground',
    labelCreateShipTo: {
      name: 'Jane Smith',
      street1: '4 Jersey St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02215',
      country: 'US',
      residential: 'yes',
    },
    labelCreateShipToPhone: '+1 555 0100',
    labelCreateShipFromMode: 'warehouse',
    labelCreateWarehouseId: 'se-warehouse-9',
    labelCreatePackages: [{ weightValue: 16, weightUnit: 'ounce' }],
    ...overrides,
  }
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('label.create routes each mode to its own endpoint', () => {
  it('shipment mode posts to /labels/shipment/{id} and sends no shipment payload', async () => {
    fetchMock.mockResolvedValue(json(oneBoxLabel))

    await executeLabel('create', {
      labelCreateFrom: 'shipment',
      labelCreateShipmentId: 'se-ship-1',
      // Present but irrelevant in this mode: it must not leak into the body.
      labelCreateServiceCode: 'ups_ground',
    })

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/labels/shipment/se-ship-1')
    expect(init.method).toBe('POST')
    expect(body()).toEqual({
      label_format: 'pdf',
      label_layout: '4x6',
      label_download_type: 'url',
    })
  })

  it('rate mode posts to /labels/rates/{id}', async () => {
    fetchMock.mockResolvedValue(json(oneBoxLabel))

    await executeLabel('create', { labelCreateFrom: 'rate', labelCreateRateId: 'se-rate-7' })

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/labels/rates/se-rate-7')
    expect(init.method).toBe('POST')
  })

  it('scratch mode posts to /labels with the whole shipment', async () => {
    fetchMock.mockResolvedValue(json(oneBoxLabel))

    await executeLabel('create', scratchInput())

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/labels')
    expect(init.method).toBe('POST')

    const sent = body()
    expect(sent.shipment.service_code).toBe('ups_ground')
    expect(sent.shipment.carrier_id).toBe('se-carrier-1')
    expect(sent.shipment.warehouse_id).toBe('se-warehouse-9')
    expect(sent.shipment.ship_from).toBeUndefined()
    expect(sent.shipment.ship_to).toMatchObject({
      name: 'Jane Smith',
      phone: '+1 555 0100',
      address_line1: '4 Jersey St',
      city_locality: 'Boston',
      state_province: 'MA',
      postal_code: '02215',
      country_code: 'US',
      address_residential_indicator: 'yes',
    })
    expect(sent.shipment.packages).toEqual([{ weight: { value: 16, unit: 'ounce' } }])
  })

  it('scratch mode in address origin sends ship_from and no warehouse_id', async () => {
    fetchMock.mockResolvedValue(json(oneBoxLabel))

    await executeLabel(
      'create',
      scratchInput({
        labelCreateShipFromMode: 'address',
        labelCreateWarehouseId: 'se-warehouse-9',
        labelCreateShipFrom: {
          name: 'Auxx Warehouse',
          street1: '1 Dock Rd',
          city: 'Newark',
          state: 'NJ',
          zipCode: '07102',
          country: 'US',
        },
        labelCreateShipFromPhone: '+1 555 0199',
      })
    )

    const sent = body()
    expect(sent.shipment.warehouse_id).toBeUndefined()
    expect(sent.shipment.ship_from).toMatchObject({
      name: 'Auxx Warehouse',
      phone: '+1 555 0199',
      city_locality: 'Newark',
      // Never coerced to a residential/commercial claim: it drives a surcharge.
      address_residential_indicator: 'unknown',
    })
  })

  it('refuses an unknown purchase mode without calling the API', async () => {
    await expect(
      executeLabel('create', { labelCreateFrom: 'rate_shopper' })
    ).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('label.create validates before spending money', () => {
  it('names the missing address parts rather than letting ShipStation 400', async () => {
    await expect(
      executeLabel(
        'create',
        scratchInput({ labelCreateShipToPhone: '', labelCreateShipTo: { name: 'Jane Smith' } })
      )
    ).rejects.toThrow(/Ship to is missing .*phone/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a scratch purchase with no packages', async () => {
    await expect(executeLabel('create', scratchInput({ labelCreatePackages: [] }))).rejects.toThrow(
      /At least one package/
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses an address origin with no warehouse selected', async () => {
    await expect(
      executeLabel('create', scratchInput({ labelCreateWarehouseId: '' }))
    ).rejects.toThrow(/warehouse is required/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('label.get branches on the id kind', () => {
  it('a label id goes to /labels/{id}', async () => {
    fetchMock.mockResolvedValue(json(oneBoxLabel))

    await executeLabel('get', { labelGetIdKind: 'labelId', labelGetId: 'se-197559213' })

    expect(lastCall()[0]).toBe('https://api.shipstation.com/v2/labels/se-197559213')
  })

  it('an external shipment id goes to /labels/external_shipment_id/{id}', async () => {
    fetchMock.mockResolvedValue(json(oneBoxLabel))

    await executeLabel('get', {
      labelGetIdKind: 'externalShipmentId',
      labelGetId: 'order-1234',
    })

    expect(lastCall()[0]).toBe(
      'https://api.shipstation.com/v2/labels/external_shipment_id/order-1234'
    )
  })

  it('defaults to the label id when no kind was chosen', async () => {
    fetchMock.mockResolvedValue(json(oneBoxLabel))

    await executeLabel('get', { labelGetId: 'se-1' })

    expect(lastCall()[0]).toBe('https://api.shipstation.com/v2/labels/se-1')
  })

  it('escapes an id that would otherwise change the path', async () => {
    fetchMock.mockResolvedValue(json(oneBoxLabel))

    await executeLabel('get', {
      labelGetIdKind: 'externalShipmentId',
      labelGetId: 'order/99?x=1',
    })

    expect(lastCall()[0]).toBe(
      'https://api.shipstation.com/v2/labels/external_shipment_id/order%2F99%3Fx%3D1'
    )
  })

  it('refuses an empty id without calling the API', async () => {
    await expect(executeLabel('get', { labelGetId: '   ' })).rejects.toBeInstanceOf(
      InvalidInputError
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('label.getMany', () => {
  it('sends the filters it was given and drops the empty ones', async () => {
    fetchMock.mockResolvedValue(json({ labels: [oneBoxLabel], total: 1, pages: 1 }))

    await executeLabel('getMany', {
      labelGetManyStatus: 'completed',
      labelGetManyCarrierId: '',
      labelGetManyShipmentId: 'se-ship-1',
      labelGetManyCreatedAtStart: '2026-09-01T00:00:00Z',
      labelGetManyPage: 2,
      labelGetManyPageSize: 50,
      labelGetManySortBy: 'modified_at',
      labelGetManySortDir: 'asc',
    })

    const url = new URL(lastCall()[0])
    expect(url.pathname).toBe('/v2/labels')
    expect(url.searchParams.get('label_status')).toBe('completed')
    expect(url.searchParams.get('shipment_id')).toBe('se-ship-1')
    expect(url.searchParams.get('created_at_start')).toBe('2026-09-01T00:00:00Z')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('page_size')).toBe('50')
    expect(url.searchParams.get('sort_by')).toBe('modified_at')
    expect(url.searchParams.get('sort_dir')).toBe('asc')
    expect(url.searchParams.has('carrier_id')).toBe(false)
  })

  it('falls back to page 1, size 25 and the newest-first default sort', async () => {
    fetchMock.mockResolvedValue(json({ labels: [], total: 0, pages: 0 }))

    const result = await executeLabel('getMany', {})

    const url = new URL(lastCall()[0])
    expect(url.searchParams.get('page')).toBe('1')
    expect(url.searchParams.get('page_size')).toBe('25')
    expect(url.searchParams.get('sort_by')).toBe('created_at')
    expect(url.searchParams.get('sort_dir')).toBe('desc')
    expect(result.labels).toEqual([])
    expect(result.hasMore).toBe(false)
  })

  it('believes the provider page count over a full page', async () => {
    fetchMock.mockResolvedValue(json({ labels: [oneBoxLabel], total: 40, pages: 2 }))

    const result = await executeLabel('getMany', { labelGetManyPage: 1, labelGetManyPageSize: 1 })

    expect(result.total).toBe(40)
    expect(result.hasMore).toBe(true)
  })
})

describe('label.void', () => {
  it('PUTs the void endpoint and reports the carrier answer, not the HTTP status', async () => {
    fetchMock.mockResolvedValue(
      json({
        approved: false,
        message: 'Label already used',
        reason_code: 'label_already_used',
        voided_label_ids: [197559213],
      })
    )

    const result = await executeLabel('void', { labelVoidId: 'se-197559213' })

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/labels/se-197559213/void')
    expect(init.method).toBe('PUT')
    expect(init.body).toBeUndefined()
    // A 200 means the request reached the carrier, never that the money came back.
    expect(result).toEqual({
      approved: false,
      message: 'Label already used',
      reasonCode: 'label_already_used',
      voidedLabelIds: ['197559213'],
    })
  })

  it('treats a missing approval flag as not approved', async () => {
    fetchMock.mockResolvedValue(json({ message: 'ok' }))

    const result = await executeLabel('void', { labelVoidId: 'se-1' })

    expect(result.approved).toBe(false)
  })
})

describe('label.createReturn', () => {
  it('POSTs the return endpoint of the OUTBOUND label', async () => {
    fetchMock.mockResolvedValue(json({ ...oneBoxLabel, label_id: 'se-2', is_return_label: true }))

    const result = await executeLabel('createReturn', {
      labelCreateReturnId: 'se-1',
      labelCreateReturnLabelFormat: 'zpl',
      labelCreateReturnLabelLayout: 'letter',
    })

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/labels/se-1/return')
    expect(init.method).toBe('POST')
    expect(body()).toEqual({
      label_format: 'zpl',
      label_layout: 'letter',
      label_download_type: 'url',
    })
    expect(result.label.labelId).toBe('se-2')
    expect(result.label.isReturnLabel).toBe(true)
  })
})

describe('label.track returns MASTER tracking only', () => {
  it('names the output masterTrackingNumber, never trackingNumber', async () => {
    fetchMock.mockResolvedValue(
      json({
        tracking_number: '1ZAAA',
        status_code: 'IT',
        status_description: 'In Transit',
        carrier_status_description: 'Departed facility',
        estimated_delivery_date: '2026-09-14T00:00:00Z',
        events: [
          {
            occurred_at: '2026-09-12T10:00:00Z',
            description: 'Departed facility',
            city_locality: 'Newark',
            state_province: 'NJ',
            status_code: 'IT',
          },
        ],
      })
    )

    const result = await executeLabel('track', { labelTrackId: 'se-1' })

    expect(lastCall()[0]).toBe('https://api.shipstation.com/v2/labels/se-1/track')
    expect(result.masterTrackingNumber).toBe('1ZAAA')
    // Per-box status is the `tracking` resource. Nothing here may be mistaken
    // for it, so there is deliberately no bare `trackingNumber` key.
    expect(result).not.toHaveProperty('trackingNumber')
    expect(result.statusCode).toBe('IT')
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      occurredAt: '2026-09-12T10:00:00Z',
      cityLocality: 'Newark',
      statusCode: 'IT',
    })
  })

  it('tolerates a track response with no events', async () => {
    fetchMock.mockResolvedValue(json({ tracking_number: '1ZAAA', status_code: 'UN' }))

    const result = await executeLabel('track', { labelTrackId: 'se-1' })

    expect(result.events).toEqual([])
    expect(result.actualDeliveryDate).toBe('')
  })
})

describe('unknown operations', () => {
  it('are refused before any request is made', async () => {
    await expect(executeLabel('rateShop', {})).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
