// tests/label-packages.test.ts

/**
 * Every box's tracking number survives `label.get` and `label.getMany`.
 *
 * This is the one thing the ShipStation app exists to get right. A multi-box
 * label carries N distinct tracking numbers, not a master plus children, and
 * the live probe found the master (sequence 1) returned LAST in the array. So:
 *
 * - the fixture here is deliberately REVERSED, and a projection that trusted
 *   array position would put the wrong box first and flag the wrong master;
 * - the void/reprint fixture checks that a voided label still hands back its
 *   full package list, because that is the history a support agent needs when a
 *   customer quotes the tracking number on the label that was thrown away.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { executeLabel } from '../src/blocks/shipstation/resources/label/label-execute.server'

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

/**
 * Three boxes, returned in the order the live API used: sequence 3, 2, then the
 * MASTER at sequence 1 last.
 */
const threeBoxLabel = {
  label_id: 'se-197559213',
  status: 'completed',
  shipment_id: 'se-3',
  external_order_id: 'order-1234',
  carrier_code: 'ups',
  service_code: 'ups_ground',
  tracking_number: '1ZMASTER',
  tracking_status: 'in_transit',
  created_at: '2026-09-10T12:00:00Z',
  ship_date: '2026-09-10T00:00:00Z',
  label_download: { href: 'https://labels.example/se-197559213.pdf' },
  tracking_url: 'https://ups.example/1ZMASTER',
  shipment_cost: { amount: 18.42, currency: 'usd' },
  packages: [
    {
      package_id: 3,
      sequence: 3,
      tracking_number: '1ZTHIRD',
      weight: { value: 32, unit: 'ounce' },
      dimensions: { length: 12, width: 9, height: 4, unit: 'inch' },
    },
    {
      package_id: 2,
      sequence: 2,
      tracking_number: '1ZSECOND',
      weight: { value: 16, unit: 'ounce' },
    },
    {
      package_id: 1,
      sequence: 1,
      tracking_number: '1ZMASTER',
      weight: { value: 48, unit: 'ounce' },
    },
  ],
}

/**
 * The label that replaced a voided one, plus the voided original. Both are real
 * rows on the account and both keep their own boxes.
 */
const voidedLabel = {
  label_id: 'se-100',
  status: 'voided',
  shipment_id: 'se-3',
  carrier_code: 'ups',
  tracking_number: '1ZOLDMASTER',
  // Probe §3: a voided label's own tracking_status still read `in_transit`.
  // It is carried through as provenance and never used to decide anything.
  tracking_status: 'in_transit',
  voided: true,
  voided_at: '2026-09-09T15:00:00Z',
  packages: [
    { package_id: 2, sequence: 2, tracking_number: '1ZOLDSECOND' },
    { package_id: 1, sequence: 1, tracking_number: '1ZOLDMASTER' },
  ],
}

const reprintLabel = {
  label_id: 'se-101',
  status: 'completed',
  shipment_id: 'se-3',
  carrier_code: 'ups',
  tracking_number: '1ZNEWMASTER',
  voided: false,
  packages: [
    { package_id: 2, sequence: 2, tracking_number: '1ZNEWSECOND' },
    { package_id: 1, sequence: 1, tracking_number: '1ZNEWMASTER' },
  ],
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('label.get returns every box, ordered by sequence', () => {
  it('reorders a reversed package array and never trusts array position', async () => {
    fetchMock.mockResolvedValue(json(threeBoxLabel))

    const { label } = await executeLabel('get', { labelGetId: 'se-197559213' })

    expect(label.packageCount).toBe(3)
    expect(label.packages.map((p: any) => p.sequence)).toEqual([1, 2, 3])
    expect(label.packages.map((p: any) => p.trackingNumber)).toEqual([
      '1ZMASTER',
      '1ZSECOND',
      '1ZTHIRD',
    ])
  })

  it('identifies the master by equality, not by position in the response', async () => {
    fetchMock.mockResolvedValue(json(threeBoxLabel))

    const { label } = await executeLabel('get', { labelGetId: 'se-197559213' })

    expect(label.masterTrackingNumber).toBe('1ZMASTER')
    expect(label.packages.filter((p: any) => p.isMaster)).toHaveLength(1)
    expect(label.packages.find((p: any) => p.isMaster).trackingNumber).toBe('1ZMASTER')
    // The master arrived last; a position-based rule would have flagged 1ZTHIRD.
    expect(label.packages[2].isMaster).toBe(false)
  })

  it('keeps each box its own weight and dimensions', async () => {
    fetchMock.mockResolvedValue(json(threeBoxLabel))

    const { label } = await executeLabel('get', { labelGetId: 'se-197559213' })

    expect(label.packages[0].weight).toEqual({ value: 48, unit: 'ounce' })
    expect(label.packages[0].dimensions).toBeNull()
    expect(label.packages[2].dimensions).toEqual({
      length: 12,
      width: 9,
      height: 4,
      unit: 'inch',
    })
  })

  it('carries the download url, tracking url and cost the projector drops', async () => {
    fetchMock.mockResolvedValue(json(threeBoxLabel))

    const { label } = await executeLabel('get', { labelGetId: 'se-197559213' })

    expect(label.labelDownloadUrl).toBe('https://labels.example/se-197559213.pdf')
    expect(label.trackingUrl).toBe('https://ups.example/1ZMASTER')
    expect(label.shipmentCostAmount).toBe(18.42)
    expect(label.shipmentCostCurrency).toBe('usd')
  })

  it('reads the label state from `status` when `label_status` is absent', async () => {
    // The live API populates `status`; the probe found `label_status` null on
    // real get and list responses. Reading only one of them loses the state.
    fetchMock.mockResolvedValue(json(threeBoxLabel))

    const { label } = await executeLabel('get', { labelGetId: 'se-197559213' })

    expect(label.labelStatus).toBe('completed')
  })
})

describe('a voided label keeps its history', () => {
  it('returns every box of the voided label, not just the master', async () => {
    fetchMock.mockResolvedValue(json(voidedLabel))

    const { label } = await executeLabel('get', { labelGetId: 'se-100' })

    expect(label.voided).toBe(true)
    expect(label.voidedAt).toBe('2026-09-09T15:00:00Z')
    expect(label.labelStatus).toBe('voided')
    expect(label.packages.map((p: any) => p.trackingNumber)).toEqual(['1ZOLDMASTER', '1ZOLDSECOND'])
  })

  it('never lets tracking_status contradict the void', async () => {
    fetchMock.mockResolvedValue(json(voidedLabel))

    const { label } = await executeLabel('get', { labelGetId: 'se-100' })

    // Carried as provenance only. `voided` is the answer.
    expect(label.trackingStatus).toBe('in_transit')
    expect(label.voided).toBe(true)
  })
})

describe('label.getMany keeps every tracking number on every row', () => {
  it('lists a void and its reprint side by side, boxes intact', async () => {
    fetchMock.mockResolvedValue(
      json({ labels: [reprintLabel, voidedLabel], total: 2, page: 1, pages: 1 })
    )

    const result = await executeLabel('getMany', { labelGetManyShipmentId: 'se-3' })

    expect(result.labels).toHaveLength(2)
    expect(result.labels[0].trackingNumbers).toEqual(['1ZNEWMASTER', '1ZNEWSECOND'])
    expect(result.labels[1].trackingNumbers).toEqual(['1ZOLDMASTER', '1ZOLDSECOND'])
    expect(result.labels[1].voided).toBe(true)
  })

  it('orders a reversed package array before flattening to tracking numbers', async () => {
    fetchMock.mockResolvedValue(json({ labels: [threeBoxLabel], total: 1, pages: 1 }))

    const result = await executeLabel('getMany', {})

    expect(result.labels[0].trackingNumbers).toEqual(['1ZMASTER', '1ZSECOND', '1ZTHIRD'])
    expect(result.labels[0].packageCount).toBe(3)
    // List rows drop per-box weights and dimensions; the numbers are the point.
    expect(result.labels[0]).not.toHaveProperty('packages')
  })

  it('drops a box with no tracking number rather than emitting a blank', async () => {
    fetchMock.mockResolvedValue(
      json({
        labels: [
          {
            ...threeBoxLabel,
            packages: [
              { package_id: 1, sequence: 1, tracking_number: '1ZMASTER' },
              { package_id: 2, sequence: 2 },
            ],
          },
        ],
        total: 1,
        pages: 1,
      })
    )

    const result = await executeLabel('getMany', {})

    expect(result.labels[0].trackingNumbers).toEqual(['1ZMASTER'])
    expect(result.labels[0].packageCount).toBe(2)
  })
})
