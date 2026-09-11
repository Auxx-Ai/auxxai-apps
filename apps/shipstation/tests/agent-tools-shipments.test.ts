// tests/agent-tools-shipments.test.ts

/**
 * `get_shipstation_shipment` and `list_shipstation_shipments`: the id-kind
 * branch, the filter mapping, and the page metadata a caller needs to tell
 * "these are all of them" from "this is page 1 of many".
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/tools/shared/shipstation-api', () => ({ shipstationApi: vi.fn() }))
vi.mock('../src/tools/shared/connection', () => ({
  getShipstationApiKey: () => 'test-api-key',
}))

import { shipstationApi } from '../src/tools/shared/shipstation-api'
import getShipstationShipment from '../src/tools/get-shipstation-shipment.tool.server'
import listShipstationShipments from '../src/tools/list-shipstation-shipments.tool.server'

const api = shipstationApi as unknown as ReturnType<typeof vi.fn>

function shipment(n: number, overrides: Record<string, unknown> = {}) {
  return {
    shipment_id: `se-${n}`,
    shipment_number: 14_530 + n,
    external_shipment_id: `ext-${n}`,
    store_id: 'se-2943015',
    shipment_status: 'label_purchased',
    carrier_id: 'se-3891373',
    service_code: 'fedex_home_delivery',
    created_at: '2026-09-09T18:12:04.000Z',
    modified_at: '2026-09-10T07:02:11.000Z',
    ship_to: {
      name: 'Dana Whitfield',
      address_line1: '1209 Bell Springs Rd',
      city_locality: 'Austin',
      state_province: 'TX',
      postal_code: '78704',
      country_code: 'US',
      address_residential_indicator: 'yes',
    },
    total_weight: { value: 2448, unit: 'ounce' },
    tags: [{ name: 'Fragile' }],
    packages: [{ shipment_package_id: 'se-3', weight: { value: 1280, unit: 'ounce' } }],
    items: [{ name: 'Vertical Lift 900', sku: 'VL-900', quantity: 1 }],
    ...overrides,
  }
}

beforeEach(() => {
  api.mockReset()
})

describe('get_shipstation_shipment', () => {
  it('reads the ShipStation id path by default', async () => {
    api.mockResolvedValue(shipment(1))

    const result = await getShipstationShipment({ shipmentId: 'se-428778294' })

    expect(api).toHaveBeenCalledWith('/shipments/se-428778294', 'test-api-key')
    expect(result.shipment.shipmentId).toBe('se-1')
  })

  it('switches to the external-id path on the id kind, not on the id shape', async () => {
    api.mockResolvedValue(shipment(1))

    await getShipstationShipment({ shipmentId: 'se-looks-native', idKind: 'external' })

    expect(api).toHaveBeenCalledWith(
      '/shipments/external_shipment_id/se-looks-native',
      'test-api-key'
    )
  })

  it('escapes an external id that is not URL safe', async () => {
    api.mockResolvedValue(shipment(1))

    await getShipstationShipment({ shipmentId: '7489518207152/8681743417520', idKind: 'external' })

    expect(api).toHaveBeenCalledWith(
      '/shipments/external_shipment_id/7489518207152%2F8681743417520',
      'test-api-key'
    )
  })

  it('projects the address, boxes, items and tags', async () => {
    api.mockResolvedValue(shipment(1))

    const { shipment: projected } = await getShipstationShipment({ shipmentId: 'se-1' })

    expect(projected.shipmentNumber).toBe('14531')
    expect(projected.shipToName).toBe('Dana Whitfield')
    expect(projected.shipToPlace).toBe('Austin, TX, US')
    expect(projected.shipTo?.residential).toBe(true)
    expect(projected.packageCount).toBe(1)
    expect(projected.packages[0]?.weight).toEqual({ value: 1280, unit: 'ounce' })
    expect(projected.packages[0]?.dimensions).toBeNull()
    expect(projected.itemCount).toBe(1)
    expect(projected.tags).toEqual(['Fragile'])
  })

  it('keeps an unclassified residential indicator null rather than calling it commercial', async () => {
    api.mockResolvedValue(
      shipment(1, {
        ship_to: { name: 'Dana Whitfield', address_residential_indicator: 'unknown' },
      })
    )

    const { shipment: projected } = await getShipstationShipment({ shipmentId: 'se-1' })

    expect(projected.shipTo?.residential).toBeNull()
  })
})

describe('list_shipstation_shipments', () => {
  it('maps every filter onto the provider query and pins the sort', async () => {
    api.mockResolvedValue({ shipments: [], total: 0, pages: 0 })

    await listShipstationShipments({
      shipmentStatus: 'label_purchased',
      storeId: 'se-2943015',
      salesOrderId: 'so-1',
      shipmentNumber: '14530',
      shipToName: 'Whitfield',
      createdAtStart: '2026-09-01T00:00:00Z',
      createdAtEnd: '2026-09-10T00:00:00Z',
      modifiedAtStart: '2026-09-09T00:00:00Z',
      modifiedAtEnd: '2026-09-10T00:00:00Z',
      page: 2,
      pageSize: 50,
    })

    expect(api).toHaveBeenCalledWith('/shipments', 'test-api-key', {
      shipment_status: 'label_purchased',
      store_id: 'se-2943015',
      sales_order_id: 'so-1',
      shipment_number: '14530',
      ship_to_name: 'Whitfield',
      created_at_start: '2026-09-01T00:00:00Z',
      created_at_end: '2026-09-10T00:00:00Z',
      modified_at_start: '2026-09-09T00:00:00Z',
      modified_at_end: '2026-09-10T00:00:00Z',
      page: 2,
      page_size: 50,
      sort_by: 'created_at',
      sort_dir: 'desc',
    })
  })

  it('reports an incomplete list as incomplete, in the flag and in the summary', async () => {
    api.mockResolvedValue({
      shipments: [shipment(1), shipment(2)],
      total: 135,
      page: 1,
      pages: 7,
    })

    const result = await listShipstationShipments({})

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.pages).toBe(7)
    expect(result.total).toBe(135)
    expect(result.hasMore).toBe(true)
    expect(result.summary).toContain('of 135 matching')
    expect(result.summary).toContain('NOT the full set')
  })

  it('reports the last page as complete', async () => {
    api.mockResolvedValue({ shipments: [shipment(1)], total: 1, page: 1, pages: 1 })

    const result = await listShipstationShipments({})

    expect(result.hasMore).toBe(false)
    expect(result.summary).toContain('This is the last page')
  })

  it('falls back to a full page meaning "maybe more" when the provider omits pages', async () => {
    api.mockResolvedValue({ shipments: Array.from({ length: 3 }, (_, i) => shipment(i)) })

    const full = await listShipstationShipments({ pageSize: 3 })
    expect(full.hasMore).toBe(true)
    expect(full.total).toBeNull()
    expect(full.pages).toBeNull()

    api.mockResolvedValue({ shipments: [shipment(1)] })
    const partial = await listShipstationShipments({ pageSize: 3 })
    expect(partial.hasMore).toBe(false)
  })

  it('says so plainly when nothing matched', async () => {
    api.mockResolvedValue({ shipments: [], total: 0, pages: 0 })

    const result = await listShipstationShipments({ shipToName: 'nobody' })

    expect(result.shipments).toEqual([])
    expect(result.summary).toBe('No shipments matched this filter.')
  })

  it('returns list rows without the detail-only fields', async () => {
    api.mockResolvedValue({ shipments: [shipment(1)], total: 1, pages: 1 })

    const result = await listShipstationShipments({})
    const row = result.shipments[0] as Record<string, unknown>

    expect(row.shipToPlace).toBe('Austin, TX, US')
    expect(row.packageCount).toBe(1)
    expect(row.packages).toBeUndefined()
    expect(row.items).toBeUndefined()
    expect(row.shipTo).toBeUndefined()
  })
})
