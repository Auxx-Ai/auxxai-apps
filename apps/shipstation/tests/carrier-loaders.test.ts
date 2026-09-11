// tests/carrier-loaders.test.ts

/**
 * The two carrier-scoped panel loaders.
 *
 * Both are called from a panel while the author is still filling it in, so the
 * load-bearing behaviour is what they do BEFORE a carrier has been picked: no
 * request at all, rather than a 404 against `/v2/carriers//services`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import listPackageTypes from '../src/blocks/shipstation/shared/list-package-types.server'
import listServices from '../src/blocks/shipstation/shared/list-services.server'

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

describe('listServices', () => {
  it('returns nothing and calls nothing without a carrier', async () => {
    expect(await listServices('')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns service codes sorted by label', async () => {
    fetchMock.mockResolvedValue(
      json({
        services: [
          { service_code: 'usps_priority_mail', name: 'USPS Priority Mail' },
          { service_code: 'usps_first_class_mail', name: 'USPS First Class Mail' },
          // No code: unusable as a value, so it is dropped rather than offered.
          { name: 'Nameless' },
        ],
      })
    )

    const options = await listServices('se-3891089')

    expect(new URL(fetchMock.mock.calls[0][0] as string).pathname).toBe(
      '/v2/carriers/se-3891089/services'
    )
    expect(options).toEqual([
      { value: 'usps_first_class_mail', label: 'USPS First Class Mail' },
      { value: 'usps_priority_mail', label: 'USPS Priority Mail' },
    ])
  })

  it('falls back to the code when a service has no name', async () => {
    fetchMock.mockResolvedValue(json({ services: [{ service_code: 'ups_ground' }] }))

    expect(await listServices('se-1')).toEqual([{ value: 'ups_ground', label: 'ups_ground' }])
  })
})

/** Route the stub by path, since this loader reads two endpoints. */
function respondByPath(bodies: Record<string, unknown>) {
  fetchMock.mockImplementation((url: string) => {
    const { pathname } = new URL(url)
    const body = bodies[pathname]
    if (body === undefined) throw new Error(`Unexpected request to ${pathname}`)
    return Promise.resolve(json(body))
  })
}

/** Every path the stub was asked for, in call order. */
function requestedPaths(): string[] {
  return fetchMock.mock.calls.map((call) => new URL(call[0] as string).pathname)
}

describe('listPackageTypes', () => {
  it('still returns the account custom types with no carrier selected', async () => {
    // This is the case the shared packages array hits: an author describing
    // boxes before any carrier has been chosen.
    respondByPath({
      '/v2/packages': { packages: [{ package_code: 'laptop_box', name: 'Laptop Box' }] },
    })

    const options = await listPackageTypes()

    expect(requestedPaths()).toEqual(['/v2/packages'])
    expect(options).toEqual([{ value: 'laptop_box', label: 'Laptop Box' }])
  })

  it('treats a blank carrier id the same as none', async () => {
    respondByPath({ '/v2/packages': { packages: [] } })

    expect(await listPackageTypes('   ')).toEqual([])
    expect(requestedPaths()).toEqual(['/v2/packages'])
  })

  it('merges the carrier types in and labels them, sorted by label', async () => {
    respondByPath({
      '/v2/packages': { packages: [{ package_code: 'laptop_box', name: 'Laptop Box' }] },
      '/v2/carriers/se-3891089/packages': {
        packages: [
          { package_code: 'small_flat_rate_box', name: 'Small Flat Rate Box' },
          { package_code: 'large_flat_rate_box', name: 'Large Flat Rate Box' },
        ],
      },
    })

    const options = await listPackageTypes('se-3891089')

    expect(requestedPaths().sort()).toEqual(['/v2/carriers/se-3891089/packages', '/v2/packages'])
    expect(options).toEqual([
      { value: 'laptop_box', label: 'Laptop Box' },
      { value: 'large_flat_rate_box', label: 'Large Flat Rate Box (carrier)' },
      { value: 'small_flat_rate_box', label: 'Small Flat Rate Box (carrier)' },
    ])
  })

  it('resolves a code collision in favour of the account custom type', async () => {
    respondByPath({
      '/v2/packages': { packages: [{ package_code: 'package', name: 'Our Standard Carton' }] },
      '/v2/carriers/se-1/packages': { packages: [{ package_code: 'package', name: 'Package' }] },
    })

    const options = await listPackageTypes('se-1')

    expect(options).toEqual([{ value: 'package', label: 'Our Standard Carton' }])
  })

  it('tolerates empty bodies from both legs', async () => {
    respondByPath({ '/v2/packages': {}, '/v2/carriers/se-1/packages': {} })

    expect(await listPackageTypes('se-1')).toEqual([])
  })
})
