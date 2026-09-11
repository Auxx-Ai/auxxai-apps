// tests/carrier-execute.test.ts

/**
 * The `carrier` resource executor.
 *
 * `fetch` is stubbed, so the assertions are the exact request the executor
 * builds and the exact shape it projects. The projections are the contract the
 * block's output variables are declared against, so a renamed key here is a
 * broken workflow, not a cosmetic change.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InvalidInputError } from '@auxx/sdk/server'
import { executeCarrier } from '../src/blocks/shipstation/resources/carrier/carrier-execute.server'

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

/** The URL of the single request the stub received. */
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

describe('carrier.getMany', () => {
  it('never asks for extended details', async () => {
    fetchMock.mockResolvedValue(json({ carriers: [] }))

    await executeCarrier('getMany', {})

    const url = requestedUrl()
    expect(url.pathname).toBe('/v2/carriers')
    // The services and package types are their own operations. Left at
    // ShipStation's default of `true`, every carrier row would carry two long
    // arrays that nothing downstream reads.
    expect(url.searchParams.get('include_extended_details')).toBe('false')
  })

  it('omits page and page size when they are unset or nonsense', async () => {
    fetchMock.mockResolvedValue(json({ carriers: [] }))

    await executeCarrier('getMany', { carrierGetManyPage: '', carrierGetManyPageSize: 0 })

    const url = requestedUrl()
    expect(url.searchParams.has('page')).toBe(false)
    expect(url.searchParams.has('page_size')).toBe(false)
  })

  it('sends page and page size as integers when they are set', async () => {
    fetchMock.mockResolvedValue(json({ carriers: [] }))

    await executeCarrier('getMany', { carrierGetManyPage: '2', carrierGetManyPageSize: 50 })

    const url = requestedUrl()
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('page_size')).toBe('50')
  })

  it('projects carriers and carries the paging counters through', async () => {
    fetchMock.mockResolvedValue(
      json({
        carriers: [
          {
            carrier_id: 'se-3891089',
            carrier_code: 'usps',
            friendly_name: 'USPS',
            nickname: 'Free',
            account_number: 'account_570827',
            primary: true,
            requires_funded_amount: true,
            balance: 3799.52,
            has_multi_package_supporting_services: false,
            supports_label_messages: true,
            disabled_by_billing_plan: false,
          },
        ],
        total: 4,
        page: 1,
        pages: 1,
      })
    )

    const result = await executeCarrier('getMany', {})

    expect(result.carriers).toEqual([
      {
        carrierId: 'se-3891089',
        carrierCode: 'usps',
        friendlyName: 'USPS',
        nickname: 'Free',
        accountNumber: 'account_570827',
        primary: true,
        requiresFundedAmount: true,
        balance: 3799.52,
        hasMultiPackageSupportingServices: false,
        supportsLabelMessages: true,
        disabledByBillingPlan: false,
      },
    ])
    expect(result.count).toBe(1)
    expect(result.total).toBe(4)
    expect(result.pages).toBe(1)
  })
})

describe('carrier.getServices', () => {
  it('calls the carrier-scoped services endpoint and projects every service', async () => {
    fetchMock.mockResolvedValue(
      json({
        services: [
          {
            carrier_id: 'se-3891089',
            carrier_code: 'usps',
            service_code: 'usps_media_mail',
            name: 'USPS Media Mail',
            domestic: true,
            international: false,
            is_multi_package_supported: false,
            send_rates: true,
          },
        ],
      })
    )

    const result = await executeCarrier('getServices', {
      carrierGetServicesCarrierId: 'se-3891089',
    })

    expect(requestedUrl().pathname).toBe('/v2/carriers/se-3891089/services')
    expect(result.services).toEqual([
      {
        carrierId: 'se-3891089',
        carrierCode: 'usps',
        serviceCode: 'usps_media_mail',
        name: 'USPS Media Mail',
        domestic: true,
        international: false,
        isMultiPackageSupported: false,
        sendRates: true,
      },
    ])
    expect(result.count).toBe(1)
  })

  it('defaults every absent flag to false rather than leaving it undefined', async () => {
    fetchMock.mockResolvedValue(json({ services: [{ service_code: 'ups_ground' }] }))

    const result = await executeCarrier('getServices', {
      carrierGetServicesCarrierId: 'se-1',
    })

    expect(result.services[0]).toEqual({
      carrierId: '',
      carrierCode: '',
      serviceCode: 'ups_ground',
      name: '',
      domestic: false,
      international: false,
      isMultiPackageSupported: false,
      sendRates: false,
    })
  })

  it('refuses a blank carrier id instead of building /v2/carriers//services', async () => {
    await expect(
      executeCarrier('getServices', { carrierGetServicesCarrierId: '  ' })
    ).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('carrier.getPackageTypes', () => {
  it('flattens dimensions onto the package row keys the block already uses', async () => {
    fetchMock.mockResolvedValue(
      json({
        packages: [
          {
            package_id: null,
            package_code: 'small_flat_rate_box',
            name: 'Small Flat Rate Box',
            description: 'USPS Small Flat Rate Box',
            dimensions: { unit: 'inch', length: 8.69, width: 5.44, height: 1.75 },
          },
        ],
      })
    )

    const result = await executeCarrier('getPackageTypes', {
      carrierGetPackageTypesCarrierId: 'se-3891089',
    })

    expect(requestedUrl().pathname).toBe('/v2/carriers/se-3891089/packages')
    // `package_id` is deliberately absent: ShipStation documents it as always
    // null for carrier-provided types, so surfacing it offers an unusable id.
    expect(result.packageTypes).toEqual([
      {
        packageCode: 'small_flat_rate_box',
        name: 'Small Flat Rate Box',
        description: 'USPS Small Flat Rate Box',
        dimensionUnit: 'inch',
        length: 8.69,
        width: 5.44,
        height: 1.75,
      },
    ])
    expect(result.count).toBe(1)
  })

  it('survives a package type with no dimensions at all', async () => {
    fetchMock.mockResolvedValue(
      json({ packages: [{ package_code: 'package', name: 'Package', description: null }] })
    )

    const result = await executeCarrier('getPackageTypes', {
      carrierGetPackageTypesCarrierId: 'se-1',
    })

    expect(result.packageTypes[0]).toEqual({
      packageCode: 'package',
      name: 'Package',
      description: '',
      dimensionUnit: '',
      length: 0,
      width: 0,
      height: 0,
    })
  })

  it('refuses a blank carrier id', async () => {
    await expect(executeCarrier('getPackageTypes', {})).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('an unknown operation', () => {
  it('is refused by name', async () => {
    await expect(executeCarrier('connect', {})).rejects.toThrow(
      'Unknown carrier operation: connect'
    )
  })
})
