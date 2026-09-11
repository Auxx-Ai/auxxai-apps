// tests/rate-request.test.ts

/**
 * What the three rate operations actually send.
 *
 * `POST /v2/rates` is the most intricate body this block builds: it is NOT a
 * flat shipment but `{ rate_options, shipment }`, where the carrier set lives in
 * `rate_options` and the boxes live in the shipment. Getting that inside out
 * rates one service instead of shopping every carrier, which looks like a
 * working workflow that quietly never finds the cheaper option.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/tools/shared/connection', () => ({
  getShipstationApiKey: () => 'test-api-key',
}))

import { InvalidInputError } from '@auxx/sdk/server'
import {
  buildEstimateBody,
  buildRateShopBody,
  executeRate,
} from '../src/blocks/shipstation/resources/rate/rate-execute.server'

const fetchMock = vi.fn()

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function sentBody(): any {
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const init = fetchMock.mock.calls[0][1] as RequestInit
  return JSON.parse(init.body as string)
}

const AUSTIN = {
  name: 'Jane Smith',
  street1: '4301 Bull Creek Rd',
  city: 'Austin',
  state: 'TX',
  zipCode: '78731',
  country: 'US',
  residential: 'yes' as const,
}

const BROOKLYN = {
  name: 'Auxx Warehouse',
  street1: '1 Front St',
  city: 'Brooklyn',
  state: 'NY',
  zipCode: '11201',
  country: 'US',
  residential: 'no' as const,
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildEstimateBody', () => {
  const base = {
    rateEstimateShipFrom: BROOKLYN,
    rateEstimateShipTo: AUSTIN,
    rateEstimateWeightValue: 32,
    rateEstimateWeightUnit: 'ounce',
    rateEstimateShipDate: '2026-09-11',
  }

  it('sends the eight locality fields flat, not an address object', () => {
    const body = buildEstimateBody(base)

    expect(body).toMatchObject({
      from_country_code: 'US',
      from_postal_code: '11201',
      from_city_locality: 'Brooklyn',
      from_state_province: 'NY',
      to_country_code: 'US',
      to_postal_code: '78731',
      to_city_locality: 'Austin',
      to_state_province: 'TX',
      weight: { value: 32, unit: 'ounce' },
      ship_date: '2026-09-11',
    })
    // The endpoint reads no street, name or phone, so none is sent.
    expect(JSON.stringify(body)).not.toContain('Bull Creek')
    expect(JSON.stringify(body)).not.toContain('Jane Smith')
  })

  it('defaults the required ship date to now rather than sending an empty one', () => {
    const body = buildEstimateBody({ ...base, rateEstimateShipDate: '' })
    expect(body.ship_date).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('sends dimensions only when all four parts are present', () => {
    expect(
      buildEstimateBody({
        ...base,
        rateEstimateLength: 10,
        rateEstimateWidth: 6,
        rateEstimateHeight: 4,
        rateEstimateDimensionUnit: 'inch',
      }).dimensions
    ).toEqual({ unit: 'inch', length: 10, width: 6, height: 4 })

    // A box with a length and no height is not a smaller request, it is a
    // rejected one.
    expect(
      buildEstimateBody({ ...base, rateEstimateLength: 10, rateEstimateDimensionUnit: 'inch' })
        .dimensions
    ).toBeUndefined()
  })

  it('takes the residential indicator from the destination address', () => {
    const body = buildEstimateBody({ ...base, rateEstimateResidential: 'unknown' })
    expect(body.address_residential_indicator).toBe('yes')
  })

  it('leaves an unanswered residential indicator off entirely', () => {
    const body = buildEstimateBody({
      ...base,
      rateEstimateShipTo: { ...AUSTIN, residential: 'unknown' as const },
      rateEstimateResidential: 'unknown',
    })
    expect(body.address_residential_indicator).toBeUndefined()
  })

  it('omits the carrier set when the author left it empty, so every carrier is estimated', () => {
    expect(buildEstimateBody(base).carrier_ids).toBeUndefined()
    expect(
      buildEstimateBody({ ...base, rateEstimateCarrierIds: ['se-1', 'se-2'] }).carrier_ids
    ).toEqual(['se-1', 'se-2'])
  })

  it('reads a bound carrier list that arrived as a comma separated string', () => {
    expect(
      buildEstimateBody({ ...base, rateEstimateCarrierIds: 'se-1, se-2' }).carrier_ids
    ).toEqual(['se-1', 'se-2'])
  })

  it('names every missing part rather than letting ShipStation answer a vague 400', () => {
    const err = (() => {
      try {
        buildEstimateBody({ rateEstimateShipTo: AUSTIN })
        return null
      } catch (e) {
        return e as Error
      }
    })()

    expect(err).not.toBeNull()
    expect(err?.message).toContain('ship from country')
    expect(err?.message).toContain('ship from postal code')
    expect(err?.message).toContain('weight')
  })
})

describe('buildRateShopBody', () => {
  const base = {
    rateGetManyCarrierIds: ['se-3891089', 'se-3891090'],
    rateGetManyShipTo: AUSTIN,
    rateGetManyShipToPhone: '512-555-0100',
    rateGetManyShipFromMode: 'warehouse',
    rateGetManyWarehouseId: 'se-warehouse-1',
    rateGetManyPackages: [
      {
        weightValue: 32,
        weightUnit: 'ounce',
        length: 10,
        width: 6,
        height: 4,
        dimensionUnit: 'inch',
      },
      { weightValue: 8, weightUnit: 'ounce' },
    ],
  }

  it('puts the carriers in rate_options and the boxes in the shipment', () => {
    const body = buildRateShopBody(base)

    expect(body.rate_options.carrier_ids).toEqual(['se-3891089', 'se-3891090'])
    expect(body.shipment.packages).toHaveLength(2)
    // The carrier must not leak into the shipment: a shipment `carrier_id`
    // rates one service instead of shopping.
    expect(body.shipment).not.toHaveProperty('carrier_id')
  })

  it('builds each package from the array row, dimensions all-or-nothing', () => {
    const [boxed, bare] = buildRateShopBody(base).shipment.packages

    expect(boxed.weight).toEqual({ value: 32, unit: 'ounce' })
    expect(boxed.dimensions).toEqual({ unit: 'inch', length: 10, width: 6, height: 4 })
    expect(bare.weight).toEqual({ value: 8, unit: 'ounce' })
    expect(bare.dimensions).toBeUndefined()
  })

  it('carries the optional package fields through, references all three or none', () => {
    const body = buildRateShopBody({
      ...base,
      rateGetManyPackages: [
        {
          weightValue: 16,
          weightUnit: 'pound',
          packageCode: 'flat_rate_envelope',
          insuredValue: 120,
          contentDescription: 'Lift controller',
          externalPackageId: 'box-1',
          reference1: 'PO-9',
          reference2: 'SO-4',
        },
      ],
    })

    const pkg = body.shipment.packages[0]
    expect(pkg.package_code).toBe('flat_rate_envelope')
    expect(pkg.insured_value).toEqual({ amount: 120, currency: 'usd' })
    expect(pkg.content_description).toBe('Lift controller')
    expect(pkg.external_package_id).toBe('box-1')
    // ShipStation requires all three label messages together.
    expect(pkg.label_messages).toBeUndefined()
  })

  it('sends a warehouse id instead of a ship_from address in warehouse mode', () => {
    const body = buildRateShopBody(base)
    expect(body.shipment.warehouse_id).toBe('se-warehouse-1')
    expect(body.shipment.ship_from).toBeUndefined()
  })

  it('sends a ship_from address instead of a warehouse in address mode', () => {
    const body = buildRateShopBody({
      ...base,
      rateGetManyShipFromMode: 'address',
      rateGetManyShipFrom: BROOKLYN,
      rateGetManyShipFromPhone: '718-555-0100',
    })

    expect(body.shipment.warehouse_id).toBeUndefined()
    expect(body.shipment.ship_from).toMatchObject({
      name: 'Auxx Warehouse',
      phone: '718-555-0100',
      address_line1: '1 Front St',
      city_locality: 'Brooklyn',
      state_province: 'NY',
      postal_code: '11201',
      country_code: 'US',
      address_residential_indicator: 'no',
    })
  })

  it('maps the destination through the shared address converter', () => {
    expect(buildRateShopBody(base).shipment.ship_to).toMatchObject({
      name: 'Jane Smith',
      phone: '512-555-0100',
      address_line1: '4301 Bull Creek Rd',
      city_locality: 'Austin',
      state_province: 'TX',
      postal_code: '78731',
      country_code: 'US',
      address_residential_indicator: 'yes',
    })
  })

  it('carries the optional rate options and drops the ones left at their default', () => {
    const body = buildRateShopBody({
      ...base,
      rateGetManyServiceCodes: 'usps_priority_mail, ups_ground',
      rateGetManyPackageTypes: 'package',
      rateGetManyPreferredCurrency: 'USD',
      rateGetManyCalculateTaxAmount: true,
      rateGetManyIsReturn: false,
      rateGetManyConfirmation: 'signature',
      rateGetManyShipDate: '2026-09-11',
    })

    expect(body.rate_options.service_codes).toEqual(['usps_priority_mail', 'ups_ground'])
    expect(body.rate_options.package_types).toEqual(['package'])
    expect(body.rate_options.preferred_currency).toBe('usd')
    expect(body.rate_options.calculate_tax_amount).toBe(true)
    expect(body.rate_options.is_return).toBeUndefined()
    expect(body.shipment.confirmation).toBe('signature')
    expect(body.shipment.ship_date).toBe('2026-09-11')
  })

  it('leaves a confirmation of none off, because none is the absence of one', () => {
    expect(
      buildRateShopBody({ ...base, rateGetManyConfirmation: 'none' }).shipment.confirmation
    ).toBeUndefined()
  })

  it('refuses a rate shop with no carrier, which ShipStation requires', () => {
    expect(() => buildRateShopBody({ ...base, rateGetManyCarrierIds: [] })).toThrow(
      InvalidInputError
    )
  })

  it('refuses a rate shop with no packages, and names the gap', () => {
    const err = (() => {
      try {
        buildRateShopBody({ ...base, rateGetManyPackages: [] })
        return null
      } catch (e) {
        return e as Error
      }
    })()
    expect(err?.message).toContain('at least one package')
  })

  it('refuses a package row with no weight', () => {
    const err = (() => {
      try {
        buildRateShopBody({ ...base, rateGetManyPackages: [{ weightUnit: 'ounce' }] })
        return null
      } catch (e) {
        return e as Error
      }
    })()
    expect(err?.message).toContain('a weight on every package')
  })

  it('names a missing destination field rather than sending a partial address', () => {
    const err = (() => {
      try {
        buildRateShopBody({
          ...base,
          rateGetManyShipTo: { ...AUSTIN, zipCode: '' },
          rateGetManyShipToPhone: '',
        })
        return null
      } catch (e) {
        return e as Error
      }
    })()
    expect(err?.message).toContain('a ship to postal code')
    expect(err?.message).toContain('a ship to phone')
  })

  it('refuses warehouse mode with no warehouse picked', () => {
    const err = (() => {
      try {
        buildRateShopBody({ ...base, rateGetManyWarehouseId: '' })
        return null
      } catch (e) {
        return e as Error
      }
    })()
    expect(err?.message).toContain('a ship from warehouse')
  })
})

describe('executeRate', () => {
  it('POSTs the rate shop to /v2/rates and unwraps rate_response', async () => {
    fetchMock.mockResolvedValue(
      json({
        shipment_id: 'se-ship-9',
        rate_response: {
          rates: [
            {
              rate_id: 'se-rate-1',
              shipping_amount: { amount: 9.5, currency: 'usd' },
              service_code: 'usps_priority_mail',
            },
          ],
          status: 'completed',
        },
      })
    )

    const result = await executeRate('getMany', {
      rateGetManyCarrierIds: ['se-1'],
      rateGetManyShipTo: AUSTIN,
      rateGetManyShipToPhone: '512-555-0100',
      rateGetManyShipFromMode: 'warehouse',
      rateGetManyWarehouseId: 'se-warehouse-1',
      rateGetManyPackages: [{ weightValue: 16, weightUnit: 'ounce' }],
    })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.shipstation.com/v2/rates')
    expect(init.method).toBe('POST')
    expect(sentBody()).toMatchObject({
      rate_options: { carrier_ids: ['se-1'] },
      shipment: { warehouse_id: 'se-warehouse-1' },
    })

    expect(result.count).toBe(1)
    expect(result.cheapest.rateId).toBe('se-rate-1')
    expect(result.cheapest.totalAmount).toBe(950)
    // The envelope's shipment id is the authority, not rate_response's.
    expect(result.shipmentId).toBe('se-ship-9')
  })

  it('POSTs an estimate to /v2/rates/estimate and reads the bare array back', async () => {
    fetchMock.mockResolvedValue(
      json([
        { service_code: 'ups_ground', shipping_amount: { amount: 14, currency: 'usd' } },
        { service_code: 'usps_priority_mail', shipping_amount: { amount: 7, currency: 'usd' } },
      ])
    )

    const result = await executeRate('estimate', {
      rateEstimateShipFrom: BROOKLYN,
      rateEstimateShipTo: AUSTIN,
      rateEstimateWeightValue: 16,
      rateEstimateWeightUnit: 'ounce',
      rateEstimateShipDate: '2026-09-11',
    })

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.shipstation.com/v2/rates/estimate')
    expect(result.count).toBe(2)
    expect(result.cheapest.serviceCode).toBe('usps_priority_mail')
    // An estimate is not purchasable, and says so.
    expect(result.cheapest.rateId).toBe('')
  })

  it('GETs the rates already calculated for a shipment', async () => {
    fetchMock.mockResolvedValue(
      json({ rates: [], invalid_rates: [], shipment_id: 'se-ship-3', status: 'completed' })
    )

    const result = await executeRate('getForShipment', {
      rateGetForShipmentShipmentId: 'se-ship-3',
      rateGetForShipmentCreatedAtStart: '2026-09-01T00:00:00Z',
    })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.pathname).toBe('/v2/shipments/se-ship-3/rates')
    expect(url.searchParams.get('created_at_start')).toBe('2026-09-01T00:00:00Z')
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('GET')
    expect(result.shipmentId).toBe('se-ship-3')
    expect(result.count).toBe(0)
  })

  it('never calls the provider when the rate shop input is incomplete', async () => {
    await expect(executeRate('getMany', { rateGetManyCarrierIds: [] })).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses an operation the resource does not have', async () => {
    await expect(executeRate('purchase', {})).rejects.toThrow(/Unknown rate operation/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
