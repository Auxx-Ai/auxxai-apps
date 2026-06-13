// tests/map-shipment.test.ts

import { describe, expect, it } from 'vitest'
import { mapShipment } from '../src/tools/shared/map-shipment'
import type { RawPackage } from '../src/tools/shared/ups-api'

function pkg(over: Partial<RawPackage> = {}): RawPackage {
  return {
    currentStatus: { type: 'I', code: 'OR', description: 'Origin Scan' },
    activity: [
      {
        gmtDate: '20260612',
        gmtTime: '121356',
        location: { address: { city: 'Wayne', stateProvince: 'NJ', countryCode: 'US' } },
        status: { type: 'I', description: 'Origin Scan' },
      },
    ],
    ...over,
  }
}

describe('status mapping', () => {
  const cases: Array<[string, string]> = [
    ['M', 'label_created'],
    ['P', 'picked_up'],
    ['I', 'in_transit'],
    ['X', 'exception'],
    ['D', 'delivered'],
    ['RS', 'returned_to_shipper'],
  ]
  it.each(cases)('maps type %s → %s', (type, expected) => {
    const { shipment } = mapShipment('1', pkg({ currentStatus: { type, code: 'XX' } }))
    expect(shipment?.statusType).toBe(expected)
  })

  it('falls back to unknown for an unrecognized type, keeping the raw code', () => {
    const { shipment } = mapShipment('1', pkg({ currentStatus: { type: 'U', code: 'ZZ' } }))
    expect(shipment?.statusType).toBe('unknown')
    expect(shipment?.statusCode).toBe('ZZ')
  })
})

describe('not found', () => {
  it('returns found:false for a null package', () => {
    expect(mapShipment('1', null)).toEqual({ found: false, shipment: null })
  })
})

describe('field mapping', () => {
  it('parses UPS gmtDate/gmtTime into UTC ISO', () => {
    const { shipment } = mapShipment('1', pkg())
    expect(shipment?.scanEvents[0].date).toBe('2026-06-12T12:13:56.000Z')
    expect(shipment?.lastActivity?.location).toBe('Wayne, NJ, US')
  })

  it('sorts scan events newest-first and caps at 20', () => {
    const activity = Array.from({ length: 25 }, (_, i) => ({
      gmtDate: `202606${String((i % 28) + 1).padStart(2, '0')}`,
      gmtTime: '000000',
      status: { description: `e${i}` },
      location: { address: {} },
    }))
    const { shipment } = mapShipment('1', pkg({ activity }))
    expect(shipment?.scanEvents).toHaveLength(20)
    const dates = shipment?.scanEvents.map((e) => e.date ?? '') ?? []
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('extracts estimated delivery date, service, weight and reference numbers', () => {
    const { shipment } = mapShipment(
      '1',
      pkg({
        deliveryDate: [{ date: '20260614', type: 'SDD' }],
        service: { description: 'UPS Ground' },
        weight: { weight: '5', unitOfMeasurement: 'LBS' },
        referenceNumber: [{ number: 'ShipRef123', type: 'SHIPMENT' }, { number: '' }],
      })
    )
    expect(shipment?.estimatedDelivery).toBe('2026-06-14')
    expect(shipment?.service).toBe('UPS Ground')
    expect(shipment?.weight).toBe('5 LBS')
    expect(shipment?.referenceNumbers).toEqual(['ShipRef123'])
  })

  it('sets deliveredAt from the delivery activity when delivered', () => {
    const { shipment } = mapShipment(
      '1',
      pkg({
        currentStatus: { type: 'D', code: 'FS', description: 'Delivered' },
        activity: [
          {
            gmtDate: '20260611',
            gmtTime: '193200',
            status: { type: 'D', description: 'Delivered' },
            location: { address: { city: 'San Francisco', stateProvince: 'CA', countryCode: 'US' } },
          },
        ],
      })
    )
    expect(shipment?.statusType).toBe('delivered')
    expect(shipment?.deliveredAt).toBe('2026-06-11T19:32:00.000Z')
  })

  it('maps proof of delivery and signature when present, null otherwise', () => {
    const withProof = mapShipment(
      '1',
      pkg({
        deliveryInformation: {
          pod: { content: 'POD-DATA' },
          signature: { image: 'base64sig' },
        },
      })
    ).shipment
    expect(withProof?.proofOfDelivery).toBe('POD-DATA')
    expect(withProof?.signature).toBe('base64sig')

    const without = mapShipment('1', pkg()).shipment
    expect(without?.proofOfDelivery).toBeNull()
    expect(without?.signature).toBeNull()
  })

  it('tolerates missing delivery/weight/reference fields', () => {
    const { found, shipment } = mapShipment('1', { currentStatus: { type: 'I', code: 'OR' } })
    expect(found).toBe(true)
    expect(shipment?.estimatedDelivery).toBeNull()
    expect(shipment?.weight).toBeNull()
    expect(shipment?.referenceNumbers).toEqual([])
    expect(shipment?.scanEvents).toEqual([])
    expect(shipment?.lastActivity).toBeNull()
  })

  it('drops UPS placeholder "string" values', () => {
    const { shipment } = mapShipment(
      '1',
      pkg({
        service: { description: 'string' },
        weight: { weight: 'string', unitOfMeasurement: 'string' },
      })
    )
    expect(shipment?.service).toBeNull()
    expect(shipment?.weight).toBeNull()
  })
})
