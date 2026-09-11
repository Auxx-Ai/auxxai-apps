// tests/rate-projection.test.ts

/**
 * The rate projection: money, ordering and the buyable/unbuyable split.
 *
 * Three things here can be silently wrong and all three cost money:
 * the decimal-to-cents conversion, the definition of the total, and the order
 * a workflow picks "the cheapest" from.
 */

import { describe, expect, it } from 'vitest'

import {
  projectRate,
  projectRatesInformation,
  sortRates,
} from '../src/blocks/shipstation/resources/rate/rate-execute.server'

function rate(overrides: Record<string, any> = {}) {
  return {
    rate_id: 'se-rate-1',
    rate_type: 'shipment',
    carrier_id: 'se-3891089',
    carrier_code: 'stamps_com',
    carrier_friendly_name: 'USPS',
    carrier_nickname: 'Free',
    service_code: 'usps_priority_mail',
    service_type: 'Priority Mail',
    package_type: 'package',
    shipping_amount: { amount: 12.5, currency: 'usd' },
    insurance_amount: { amount: 0, currency: 'usd' },
    confirmation_amount: { amount: 0.75, currency: 'usd' },
    other_amount: { amount: 0, currency: 'usd' },
    tax_amount: { amount: 1.2, currency: 'usd' },
    delivery_days: 3,
    carrier_delivery_days: '3',
    estimated_delivery_date: '2026-09-14T00:00:00Z',
    ship_date: '2026-09-11T00:00:00Z',
    guaranteed_service: false,
    negotiated_rate: true,
    trackable: true,
    zone: 4,
    validation_status: 'valid',
    warning_messages: [],
    error_messages: [],
    ...overrides,
  }
}

describe('projectRate', () => {
  it('carries the amounts through as minor units and keeps the currency', () => {
    const result = projectRate(rate())

    expect(result.shippingAmount).toBe(1250)
    expect(result.confirmationAmount).toBe(75)
    expect(result.insuranceAmount).toBe(0)
    expect(result.taxAmount).toBe(120)
    expect(result.currency).toBe('usd')
  })

  it('totals the four legs ShipStation calls the purchase price, and excludes tax', () => {
    // ShipStation's own field descriptions define the purchase price as
    // shipping + insurance + confirmation + other. Tax is a separate answer.
    expect(projectRate(rate()).totalAmount).toBe(1325)
  })

  it('keeps the identity and the service naming intact', () => {
    const result = projectRate(rate())
    expect(result.rateId).toBe('se-rate-1')
    expect(result.carrierId).toBe('se-3891089')
    expect(result.carrierCode).toBe('stamps_com')
    expect(result.carrierFriendlyName).toBe('USPS')
    expect(result.serviceCode).toBe('usps_priority_mail')
    expect(result.serviceType).toBe('Priority Mail')
  })

  it('reads the currency off whichever leg carries one', () => {
    const result = projectRate(
      rate({
        shipping_amount: { amount: 9.99 },
        other_amount: { amount: 0, currency: 'cad' },
      })
    )
    expect(result.currency).toBe('cad')
    expect(result.shippingAmount).toBe(999)
  })

  it('reads an estimate, which carries no rate_id and so cannot be bought', () => {
    const estimate = rate()
    delete (estimate as Record<string, unknown>).rate_id
    expect(projectRate(estimate).rateId).toBe('')
  })

  it('does not invent amounts when a leg is missing entirely', () => {
    const result = projectRate({ carrier_code: 'ups' })
    expect(result.totalAmount).toBe(0)
    expect(result.taxAmount).toBe(0)
    expect(result.currency).toBe('')
    expect(result.warningMessages).toEqual([])
  })

  it('rounds to the nearest cent rather than truncating', () => {
    expect(
      projectRate(rate({ shipping_amount: { amount: 10.005, currency: 'usd' } })).shippingAmount
    ).toBe(1001)
    expect(
      projectRate(rate({ shipping_amount: { amount: 10.004, currency: 'usd' } })).shippingAmount
    ).toBe(1000)
  })
})

describe('sortRates', () => {
  it('puts the cheapest first', () => {
    const rates = [
      projectRate(rate({ rate_id: 'a', shipping_amount: { amount: 30, currency: 'usd' } })),
      projectRate(rate({ rate_id: 'b', shipping_amount: { amount: 10, currency: 'usd' } })),
      projectRate(rate({ rate_id: 'c', shipping_amount: { amount: 20, currency: 'usd' } })),
    ]
    expect(sortRates(rates).map((r) => r.rateId)).toEqual(['b', 'c', 'a'])
  })

  it('breaks a price tie with the faster service', () => {
    const rates = [
      projectRate(rate({ rate_id: 'slow', delivery_days: 5 })),
      projectRate(rate({ rate_id: 'fast', delivery_days: 1 })),
    ]
    expect(sortRates(rates).map((r) => r.rateId)).toEqual(['fast', 'slow'])
  })

  it('sorts a rate with no delivery estimate last, not first', () => {
    // A missing estimate arrives as 0, which would otherwise read as same-day.
    const rates = [
      projectRate(rate({ rate_id: 'unknown', delivery_days: undefined })),
      projectRate(rate({ rate_id: 'twoDay', delivery_days: 2 })),
    ]
    expect(sortRates(rates).map((r) => r.rateId)).toEqual(['twoDay', 'unknown'])
  })

  it('is stable across runs when price and speed both tie', () => {
    const rates = [
      projectRate(rate({ rate_id: 'z', carrier_code: 'ups', service_code: 'ups_ground' })),
      projectRate(rate({ rate_id: 'a', carrier_code: 'fedex', service_code: 'fedex_ground' })),
    ]
    expect(sortRates(rates).map((r) => r.rateId)).toEqual(['a', 'z'])
    expect(sortRates(rates.slice().reverse()).map((r) => r.rateId)).toEqual(['a', 'z'])
  })

  it('does not mutate the array it was handed', () => {
    const rates = [
      projectRate(rate({ rate_id: 'a', shipping_amount: { amount: 30, currency: 'usd' } })),
      projectRate(rate({ rate_id: 'b', shipping_amount: { amount: 10, currency: 'usd' } })),
    ]
    sortRates(rates)
    expect(rates.map((r) => r.rateId)).toEqual(['a', 'b'])
  })
})

describe('projectRatesInformation', () => {
  it('names the cheapest rate and counts only the buyable ones', () => {
    const result = projectRatesInformation({
      rates: [
        rate({ rate_id: 'pricey', shipping_amount: { amount: 30, currency: 'usd' } }),
        rate({ rate_id: 'cheap', shipping_amount: { amount: 4, currency: 'usd' } }),
      ],
      invalid_rates: [rate({ rate_id: 'broken', validation_status: 'invalid' })],
      rate_request_id: 'se-req-1',
      shipment_id: 'se-ship-1',
      status: 'completed',
      errors: [{ message: 'ups: postal code not serviced' }],
    })

    expect(result.count).toBe(2)
    expect(result.cheapest?.rateId).toBe('cheap')
    expect(result.rates.map((r) => r.rateId)).toEqual(['cheap', 'pricey'])
    expect(result.rateRequestId).toBe('se-req-1')
    expect(result.status).toBe('completed')
    expect(result.errors).toEqual(['ups: postal code not serviced'])
  })

  it('keeps invalid rates out of the list a workflow picks from', () => {
    // An invalid rate cannot be bought. Listing it next to the valid ones would
    // let a "cheapest" branch select something that fails at purchase.
    const result = projectRatesInformation({
      rates: [rate({ rate_id: 'valid', shipping_amount: { amount: 20, currency: 'usd' } })],
      invalid_rates: [
        rate({
          rate_id: 'cheaper-but-invalid',
          shipping_amount: { amount: 1, currency: 'usd' },
          validation_status: 'invalid',
        }),
      ],
    })

    expect(result.rates).toHaveLength(1)
    expect(result.cheapest?.rateId).toBe('valid')
    expect(result.invalidRates.map((r) => r.rateId)).toEqual(['cheaper-but-invalid'])
  })

  it('reports no cheapest rate rather than a hole when nothing came back', () => {
    const result = projectRatesInformation({ rates: [], status: 'error' })
    expect(result.count).toBe(0)
    expect(result.cheapest).toBeNull()
    expect(result.invalidRates).toEqual([])
  })
})
