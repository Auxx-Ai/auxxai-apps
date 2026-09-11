// tests/shipment-execute.test.ts

/**
 * The `shipment` resource executor.
 *
 * `fetch` is stubbed and never called for real, so the assertion is the exact
 * request the executor builds: which of the two `get` endpoints the id kind
 * picks, that a tag name reaches the URL encoded rather than splitting the
 * path, that `create` sends `warehouse_id` OR `ship_from` and never both, and
 * that an incomplete address is refused BEFORE the call so the author gets a
 * message naming the missing part instead of ShipStation's opaque 400.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InvalidInputError } from '@auxx/sdk/server'

vi.mock('../src/tools/shared/connection', () => ({
  getShipstationApiKey: () => 'test-api-key',
}))

import { executeShipment } from '../src/blocks/shipstation/resources/shipment/shipment-execute.server'

const fetchMock = vi.fn()

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function empty(status = 204) {
  return new Response(null, { status })
}

/** The url and init of the nth `fetch` call. */
function callAt(index: number): { url: string; init: RequestInit } {
  const call = fetchMock.mock.calls[index] as [string, RequestInit]
  expect(call).toBeDefined()
  return { url: call[0], init: call[1] }
}

function bodyOf(init: RequestInit): any {
  return JSON.parse(String(init.body))
}

/** A complete address, as a `Workflow.address()` field stores it. */
const COMPLETE_ADDRESS = {
  name: 'Jane Smith',
  street1: '4 Jersey St',
  city: 'Boston',
  state: 'MA',
  zipCode: '02215',
  country: 'us',
  residential: 'yes' as const,
}

const RAW_SHIPMENT = {
  shipment_id: 'se-1',
  external_shipment_id: 'ext-1',
  shipment_number: '1001',
  shipment_status: 'pending',
  carrier_id: 'se-carrier',
  service_code: 'usps_priority_mail',
  warehouse_id: 'se-wh',
  created_at: '2026-09-01T00:00:00Z',
  modified_at: '2026-09-02T00:00:00Z',
  total_weight: { value: 32, unit: 'ounce' },
  tags: [{ name: 'Fragile' }, { name: 'Rush' }],
  packages: [{}, {}],
  ship_to: {
    name: 'Jane Smith',
    phone: '555-0100',
    address_line1: '4 Jersey St',
    city_locality: 'Boston',
    state_province: 'MA',
    postal_code: '02215',
    country_code: 'US',
  },
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('get', () => {
  it('uses /shipments/{id} when the id is a ShipStation id', async () => {
    fetchMock.mockResolvedValue(json(RAW_SHIPMENT))

    const result = await executeShipment('get', {
      shipmentGetIdKind: 'shipmentId',
      shipmentGetId: 'se-1',
    })

    expect(callAt(0).url).toBe('https://api.shipstation.com/v2/shipments/se-1')
    expect(result.shipment.shipmentId).toBe('se-1')
    expect(result.shipment.shipToCity).toBe('Boston')
    expect(result.shipment.tags).toEqual(['Fragile', 'Rush'])
    expect(result.shipment.packageCount).toBe(2)
    expect(result.shipment.totalWeightValue).toBe(32)
  })

  it('switches to the external-id endpoint on the other id kind', async () => {
    fetchMock.mockResolvedValue(json(RAW_SHIPMENT))

    await executeShipment('get', {
      shipmentGetIdKind: 'externalShipmentId',
      shipmentGetId: 'ORDER-9',
    })

    expect(callAt(0).url).toBe(
      'https://api.shipstation.com/v2/shipments/external_shipment_id/ORDER-9'
    )
  })

  it('defaults to the ShipStation id endpoint when the kind is absent', async () => {
    fetchMock.mockResolvedValue(json(RAW_SHIPMENT))

    await executeShipment('get', { shipmentGetId: 'se-1' })

    expect(callAt(0).url).toBe('https://api.shipstation.com/v2/shipments/se-1')
  })

  it('encodes an external id so a slash cannot invent a path segment', async () => {
    fetchMock.mockResolvedValue(json(RAW_SHIPMENT))

    await executeShipment('get', {
      shipmentGetIdKind: 'externalShipmentId',
      shipmentGetId: 'shop/1 2',
    })

    expect(callAt(0).url).toBe(
      'https://api.shipstation.com/v2/shipments/external_shipment_id/shop%2F1%202'
    )
  })

  it('refuses an empty id without calling ShipStation', async () => {
    await expect(executeShipment('get', { shipmentGetId: '   ' })).rejects.toBeInstanceOf(
      InvalidInputError
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('getMany', () => {
  it('sends the filters that were filled in and drops the ones that were not', async () => {
    fetchMock.mockResolvedValue(json({ shipments: [RAW_SHIPMENT], total: 41, page: 2, pages: 3 }))

    const result = await executeShipment('getMany', {
      shipmentGetManyStatus: '',
      shipmentGetManyModifiedAtStart: '2026-09-01T00:00:00Z',
      shipmentGetManyTag: 'Rush',
      shipmentGetManyStoreId: '',
      shipmentGetManyPage: 2,
      shipmentGetManyPageSize: 50,
      shipmentGetManySortBy: 'modified_at',
      shipmentGetManySortDir: 'asc',
    })

    const url = new URL(callAt(0).url)
    expect(url.pathname).toBe('/v2/shipments')
    expect(url.searchParams.get('modified_at_start')).toBe('2026-09-01T00:00:00Z')
    expect(url.searchParams.get('tag')).toBe('Rush')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('page_size')).toBe('50')
    expect(url.searchParams.get('sort_dir')).toBe('asc')
    // Blank filters must not be sent: `shipment_status=` is not "any status".
    expect(url.searchParams.has('shipment_status')).toBe(false)
    expect(url.searchParams.has('store_id')).toBe(false)

    expect(result.count).toBe(1)
    expect(result.total).toBe(41)
    expect(result.page).toBe(2)
    expect(result.pages).toBe(3)
  })

  it('drops a page number below one rather than sending it', async () => {
    fetchMock.mockResolvedValue(json({ shipments: [] }))

    await executeShipment('getMany', { shipmentGetManyPage: 0, shipmentGetManyPageSize: -5 })

    const url = new URL(callAt(0).url)
    expect(url.searchParams.has('page')).toBe(false)
    expect(url.searchParams.has('page_size')).toBe(false)
  })
})

describe('create', () => {
  it('sends warehouse_id and no ship_from in warehouse mode', async () => {
    fetchMock.mockResolvedValue(json({ has_errors: false, shipments: [RAW_SHIPMENT] }))

    await executeShipment('create', {
      shipmentCreateShipTo: COMPLETE_ADDRESS,
      shipmentCreateShipToPhone: '555-0100',
      shipmentCreateShipFromMode: 'warehouse',
      shipmentCreateWarehouseId: 'se-wh-1',
      shipmentCreatePackages: [{ weightValue: 16, weightUnit: 'ounce' }],
    })

    const { url, init } = callAt(0)
    expect(url).toBe('https://api.shipstation.com/v2/shipments')
    expect(init.method).toBe('POST')

    const body = bodyOf(init)
    expect(Array.isArray(body.shipments)).toBe(true)
    const shipment = body.shipments[0]
    expect(shipment.warehouse_id).toBe('se-wh-1')
    expect(shipment.ship_from).toBeUndefined()
    expect(shipment.ship_to.address_line1).toBe('4 Jersey St')
    expect(shipment.ship_to.country_code).toBe('US')
    expect(shipment.ship_to.address_residential_indicator).toBe('yes')
    expect(shipment.packages).toEqual([{ weight: { value: 16, unit: 'ounce' } }])
  })

  it('sends ship_from and no warehouse_id in address mode', async () => {
    fetchMock.mockResolvedValue(json({ has_errors: false, shipments: [RAW_SHIPMENT] }))

    await executeShipment('create', {
      shipmentCreateShipTo: COMPLETE_ADDRESS,
      shipmentCreateShipToPhone: '555-0100',
      shipmentCreateShipFromMode: 'address',
      // A warehouse left over from before the mode was switched must be ignored.
      shipmentCreateWarehouseId: 'se-wh-1',
      shipmentCreateShipFrom: { ...COMPLETE_ADDRESS, name: 'Auxx Lift', city: 'Cambridge' },
      shipmentCreateShipFromPhone: '555-0199',
    })

    const shipment = bodyOf(callAt(0).init).shipments[0]
    expect(shipment.warehouse_id).toBeUndefined()
    expect(shipment.ship_from.city_locality).toBe('Cambridge')
    expect(shipment.ship_from.phone).toBe('555-0199')
  })

  it('refuses a carrier with no service code, before the call', async () => {
    // ShipStation validates this pair asymmetrically: POST /v2/shipments takes
    // a carrier with no service and returns 201, then label.create refuses that
    // same shipment. Without this guard the error lands on the NEXT node,
    // against a shipment that already exists and cannot be patched in place.
    const promise = executeShipment('create', {
      shipmentCreateShipTo: COMPLETE_ADDRESS,
      shipmentCreateShipToPhone: '555-0100',
      shipmentCreateShipFromMode: 'warehouse',
      shipmentCreateWarehouseId: 'se-wh-1',
      shipmentCreateCarrierId: 'se-3891373',
    })

    await expect(promise).rejects.toBeInstanceOf(InvalidInputError)
    await expect(promise).rejects.toThrow(/Service code is required/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('allows a carrier WITH a service code', async () => {
    fetchMock.mockResolvedValue(json({ has_errors: false, shipments: [RAW_SHIPMENT] }))

    await executeShipment('create', {
      shipmentCreateShipTo: COMPLETE_ADDRESS,
      shipmentCreateShipToPhone: '555-0100',
      shipmentCreateShipFromMode: 'warehouse',
      shipmentCreateWarehouseId: 'se-wh-1',
      shipmentCreateCarrierId: 'se-3891373',
      shipmentCreateServiceCode: 'fedex_home_delivery',
    })

    const shipment = bodyOf(callAt(0).init).shipments[0]
    expect(shipment.carrier_id).toBe('se-3891373')
    expect(shipment.service_code).toBe('fedex_home_delivery')
  })

  it('allows NEITHER — no carrier means the label step still chooses', async () => {
    fetchMock.mockResolvedValue(json({ has_errors: false, shipments: [RAW_SHIPMENT] }))

    await executeShipment('create', {
      shipmentCreateShipTo: COMPLETE_ADDRESS,
      shipmentCreateShipToPhone: '555-0100',
      shipmentCreateShipFromMode: 'warehouse',
      shipmentCreateWarehouseId: 'se-wh-1',
    })

    const shipment = bodyOf(callAt(0).init).shipments[0]
    expect(shipment.carrier_id).toBeUndefined()
    expect(shipment.service_code).toBeUndefined()
  })

  it('treats a whitespace-only service code as absent', async () => {
    await expect(
      executeShipment('create', {
        shipmentCreateShipTo: COMPLETE_ADDRESS,
        shipmentCreateShipToPhone: '555-0100',
        shipmentCreateShipFromMode: 'warehouse',
        shipmentCreateWarehouseId: 'se-wh-1',
        shipmentCreateCarrierId: 'se-3891373',
        shipmentCreateServiceCode: '   ',
      })
    ).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses warehouse mode with no warehouse chosen, before the call', async () => {
    await expect(
      executeShipment('create', {
        shipmentCreateShipTo: COMPLETE_ADDRESS,
        shipmentCreateShipToPhone: '555-0100',
        shipmentCreateShipFromMode: 'warehouse',
      })
    ).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('names the missing address parts instead of calling ShipStation', async () => {
    const promise = executeShipment('create', {
      shipmentCreateShipTo: { street1: '4 Jersey St', city: 'Boston' },
      shipmentCreateShipFromMode: 'warehouse',
      shipmentCreateWarehouseId: 'se-wh-1',
    })

    await expect(promise).rejects.toBeInstanceOf(InvalidInputError)
    await expect(promise).rejects.toThrow(/Ship to is missing/)
    await expect(promise).rejects.toThrow(/phone/)
    await expect(promise).rejects.toThrow(/postal code/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('names the missing ship-from parts in address mode, before the call', async () => {
    const promise = executeShipment('create', {
      shipmentCreateShipTo: COMPLETE_ADDRESS,
      shipmentCreateShipToPhone: '555-0100',
      shipmentCreateShipFromMode: 'address',
      shipmentCreateShipFrom: { street1: '1 Main St' },
      shipmentCreateShipFromPhone: '555-0199',
    })

    await expect(promise).rejects.toThrow(/Ship from is missing/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws on has_errors, which ShipStation reports inside a 200', async () => {
    fetchMock.mockResolvedValue(
      json({ has_errors: true, shipments: [{ errors: ['Invalid postal code'] }] })
    )

    const promise = executeShipment('create', {
      shipmentCreateShipTo: COMPLETE_ADDRESS,
      shipmentCreateShipToPhone: '555-0100',
      shipmentCreateShipFromMode: 'warehouse',
      shipmentCreateWarehouseId: 'se-wh-1',
    })

    await expect(promise).rejects.toBeInstanceOf(InvalidInputError)
    await expect(promise).rejects.toThrow(/Invalid postal code/)
  })
})

describe('update', () => {
  it('reads the shipment first and PUTs the merge, not the diff', async () => {
    fetchMock
      .mockResolvedValueOnce(json(RAW_SHIPMENT))
      .mockResolvedValueOnce(json({ ...RAW_SHIPMENT, service_code: 'usps_ground_advantage' }))

    await executeShipment('update', {
      shipmentUpdateShipmentId: 'se-1',
      shipmentUpdateServiceCode: 'usps_ground_advantage',
      shipmentUpdateShipFromMode: 'unchanged',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(callAt(0).url).toBe('https://api.shipstation.com/v2/shipments/se-1')
    expect(callAt(0).init.method ?? 'GET').toBe('GET')

    const { url, init } = callAt(1)
    expect(url).toBe('https://api.shipstation.com/v2/shipments/se-1')
    expect(init.method).toBe('PUT')

    const body = bodyOf(init)
    expect(body.service_code).toBe('usps_ground_advantage')
    // Carried over from the read, which is the whole point: a PUT of only the
    // changed field would blank the recipient.
    expect(body.ship_to.city_locality).toBe('Boston')
    expect(body.carrier_id).toBe('se-carrier')
  })

  it('strips the fields ShipStation owns before writing them back', async () => {
    fetchMock.mockResolvedValueOnce(json(RAW_SHIPMENT)).mockResolvedValueOnce(json(RAW_SHIPMENT))

    await executeShipment('update', {
      shipmentUpdateShipmentId: 'se-1',
      shipmentUpdateInternalNotes: 'Called the customer',
    })

    const body = bodyOf(callAt(1).init)
    for (const field of [
      'shipment_id',
      'created_at',
      'modified_at',
      'shipment_status',
      'total_weight',
    ]) {
      expect(body).not.toHaveProperty(field)
    }
    expect(body.internal_notes).toBe('Called the customer')
  })

  it('clears warehouse_id when the origin is switched to an address', async () => {
    fetchMock.mockResolvedValueOnce(json(RAW_SHIPMENT)).mockResolvedValueOnce(json(RAW_SHIPMENT))

    await executeShipment('update', {
      shipmentUpdateShipmentId: 'se-1',
      shipmentUpdateShipFromMode: 'address',
      shipmentUpdateShipFrom: COMPLETE_ADDRESS,
      shipmentUpdateShipFromPhone: '555-0199',
    })

    const body = bodyOf(callAt(1).init)
    expect(body.warehouse_id).toBeNull()
    expect(body.ship_from.city_locality).toBe('Boston')
  })

  it('leaves the origin alone when the mode is unchanged', async () => {
    fetchMock.mockResolvedValueOnce(json(RAW_SHIPMENT)).mockResolvedValueOnce(json(RAW_SHIPMENT))

    await executeShipment('update', {
      shipmentUpdateShipmentId: 'se-1',
      shipmentUpdateShipFromMode: 'unchanged',
    })

    const body = bodyOf(callAt(1).init)
    expect(body.warehouse_id).toBe('se-wh')
  })

  it('re-reads when the PUT answers with an empty body', async () => {
    fetchMock
      .mockResolvedValueOnce(json(RAW_SHIPMENT))
      .mockResolvedValueOnce(empty())
      .mockResolvedValueOnce(json({ ...RAW_SHIPMENT, shipment_number: '1002' }))

    const result = await executeShipment('update', {
      shipmentUpdateShipmentId: 'se-1',
      shipmentUpdateShipmentNumber: '1002',
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(result.shipment.shipmentNumber).toBe('1002')
  })
})

describe('cancel', () => {
  it('PUTs the cancel path and tolerates an empty body', async () => {
    fetchMock.mockResolvedValue(empty())

    const result = await executeShipment('cancel', { shipmentCancelShipmentId: 'se-1' })

    const { url, init } = callAt(0)
    expect(url).toBe('https://api.shipstation.com/v2/shipments/se-1/cancel')
    expect(init.method).toBe('PUT')
    expect(init.body).toBeUndefined()
    expect(result).toEqual({ shipmentId: 'se-1', cancelled: true })
  })
})

describe('tags', () => {
  it('POSTs the tag as an encoded path segment', async () => {
    fetchMock.mockResolvedValue(json({ tags: ['Fragile', 'Deliver after 5 PM'] }))

    const result = await executeShipment('addTag', {
      shipmentAddTagShipmentId: 'se-1',
      shipmentAddTagName: 'Deliver after 5 PM',
    })

    const { url, init } = callAt(0)
    expect(url).toBe('https://api.shipstation.com/v2/shipments/se-1/tags/Deliver%20after%205%20PM')
    expect(init.method).toBe('POST')
    expect(result.tags).toEqual(['Fragile', 'Deliver after 5 PM'])
    expect(result.tagName).toBe('Deliver after 5 PM')
  })

  it('encodes a slash in a tag rather than letting it split the path', async () => {
    fetchMock.mockResolvedValue(json({ tags: [] }))

    await executeShipment('addTag', {
      shipmentAddTagShipmentId: 'se-1',
      shipmentAddTagName: 'B2B/Freight',
    })

    expect(callAt(0).url).toBe('https://api.shipstation.com/v2/shipments/se-1/tags/B2B%2FFreight')
  })

  it('DELETEs the same encoded path to remove a tag', async () => {
    fetchMock.mockResolvedValue(empty())

    const result = await executeShipment('removeTag', {
      shipmentRemoveTagShipmentId: 'se-1',
      shipmentRemoveTagName: 'B2B/Freight',
    })

    const { url, init } = callAt(0)
    expect(url).toBe('https://api.shipstation.com/v2/shipments/se-1/tags/B2B%2FFreight')
    expect(init.method).toBe('DELETE')
    expect(result.tagName).toBe('B2B/Freight')
  })

  it('refuses an empty tag name before the call', async () => {
    await expect(
      executeShipment('addTag', { shipmentAddTagShipmentId: 'se-1', shipmentAddTagName: '' })
    ).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('addNote', () => {
  it('sends both note and mode, because the endpoint requires both', async () => {
    fetchMock.mockResolvedValue(json({ internal_notes: 'Old note\nCalled the customer' }))

    const result = await executeShipment('addNote', {
      shipmentAddNoteShipmentId: 'se-1',
      shipmentAddNoteNote: 'Called the customer',
      shipmentAddNoteMode: 'append',
    })

    const { url, init } = callAt(0)
    expect(url).toBe('https://api.shipstation.com/v2/shipments/se-1/internal_notes')
    expect(init.method).toBe('POST')
    expect(bodyOf(init)).toEqual({ note: 'Called the customer', mode: 'append' })
    expect(result.internalNotes).toBe('Old note\nCalled the customer')
  })

  it('defaults to append rather than to the destructive mode', async () => {
    fetchMock.mockResolvedValue(json({ internal_notes: 'x' }))

    await executeShipment('addNote', {
      shipmentAddNoteShipmentId: 'se-1',
      shipmentAddNoteNote: 'x',
    })

    expect(bodyOf(callAt(0).init).mode).toBe('append')
  })

  it('allows an empty note only when overwriting, which is how notes are cleared', async () => {
    fetchMock.mockResolvedValue(json({ internal_notes: '' }))

    await executeShipment('addNote', {
      shipmentAddNoteShipmentId: 'se-1',
      shipmentAddNoteNote: '',
      shipmentAddNoteMode: 'overwrite',
    })

    expect(bodyOf(callAt(0).init)).toEqual({ note: '', mode: 'overwrite' })
  })

  it('refuses an empty note when appending', async () => {
    await expect(
      executeShipment('addNote', {
        shipmentAddNoteShipmentId: 'se-1',
        shipmentAddNoteNote: '  ',
        shipmentAddNoteMode: 'append',
      })
    ).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('an unknown operation', () => {
  it('is a programming error, not an API call', async () => {
    await expect(executeShipment('teleport', {})).rejects.toThrow(
      /Unknown shipment operation: teleport/
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
