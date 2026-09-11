// tests/address-validate.test.ts

/**
 * `address.validate`, the block's only resolver for `residential`.
 *
 * Three things are asserted because getting any of them wrong is silent:
 *
 * 1. The request body is an ARRAY. `POST /v2/addresses/validate` is the only
 *    operation in this block that takes one.
 * 2. A phone is NOT sent, and is not required. The shared converter always
 *    produces a `phone` key, and the request schema puts `minLength: 1` on it,
 *    so forwarding the empty string would be a 400 rather than an omission.
 * 3. The residential indicator is read from the MATCHED address, and anything
 *    that is not `yes` or `no` becomes `unknown`. `no` is a commercial claim
 *    that suppresses a carrier surcharge, so it must never be guessed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InvalidInputError, UpstreamServiceError } from '@auxx/sdk/server'
import {
  buildValidationRequest,
  executeAddress,
  projectValidationResult,
} from '../src/blocks/shipstation/resources/address/address-execute.server'

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

/** The parsed JSON body of the single request the stub received. */
function sentBody(): unknown {
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const init = fetchMock.mock.calls[0][1] as RequestInit
  return JSON.parse(init.body as string)
}

const ADDRESS = {
  name: 'Mickey Mouse',
  street1: '500 South Buena Vista Street',
  city: 'Burbank',
  state: 'CA',
  zipCode: '91521',
  country: 'us',
}

const VERIFIED_RESULT = {
  status: 'verified',
  original_address: {
    name: 'Mickey Mouse',
    address_line1: '500 South Buena Vista Street',
    city_locality: 'Burbank',
    state_province: 'CA',
    postal_code: '91521',
    country_code: 'US',
    address_residential_indicator: 'unknown',
  },
  matched_address: {
    name: 'MICKEY MOUSE',
    address_line1: '500 S BUENA VISTA ST',
    address_line2: null,
    city_locality: 'BURBANK',
    state_province: 'CA',
    postal_code: '91521-0007',
    country_code: 'US',
    address_residential_indicator: 'no',
  },
  messages: [],
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the request body', () => {
  it('is an array holding exactly one address', async () => {
    fetchMock.mockResolvedValue(json([VERIFIED_RESULT]))

    await executeAddress('validate', { addressValidateAddress: ADDRESS })

    const body = sentBody()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(1)
  })

  it('POSTs to /v2/addresses/validate', async () => {
    fetchMock.mockResolvedValue(json([VERIFIED_RESULT]))

    await executeAddress('validate', { addressValidateAddress: ADDRESS })

    expect(new URL(fetchMock.mock.calls[0][0] as string).pathname).toBe('/v2/addresses/validate')
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })

  it('never carries a phone, which this operation does not require', () => {
    const body = buildValidationRequest(ADDRESS)

    expect(body).not.toHaveProperty('phone')
  })

  it('drops optional blanks rather than sending empty strings', () => {
    const body = buildValidationRequest({
      street1: '500 South Buena Vista Street',
      street2: '   ',
      city: 'Burbank',
      state: 'CA',
      country: 'US',
    })

    expect(body).not.toHaveProperty('name')
    expect(body).not.toHaveProperty('address_line2')
    expect(body).not.toHaveProperty('postal_code')
  })

  it('upper-cases the country and carries the indicator the author claimed', () => {
    const body = buildValidationRequest({ ...ADDRESS, residential: 'yes' })

    expect(body.country_code).toBe('US')
    expect(body.address_residential_indicator).toBe('yes')
  })

  it('defaults an unanswered indicator to unknown, never to no', () => {
    expect(buildValidationRequest(ADDRESS).address_residential_indicator).toBe('unknown')
  })

  it('refuses an address missing a required part, naming what is missing', () => {
    expect(() => buildValidationRequest({ street1: '1 Main St', country: 'US' })).toThrow(
      /city, state or province/
    )
    expect(() => buildValidationRequest(undefined)).toThrow(InvalidInputError)
  })

  it('does not demand a postal code, which ShipStation can derive', () => {
    expect(() =>
      buildValidationRequest({
        street1: '500 South Buena Vista Street',
        city: 'Burbank',
        state: 'CA',
        country: 'US',
      })
    ).not.toThrow()
  })
})

describe('the residential indicator', () => {
  it('comes from the matched address, not the address that was sent', () => {
    const projected = projectValidationResult(VERIFIED_RESULT)

    // The caller claimed `unknown`; ShipStation answered `no`.
    expect(projected.residentialIndicator).toBe('no')
    expect(projected.matchedAddress.residential).toBe('no')
  })

  it('falls back to the original address when nothing matched', () => {
    const projected = projectValidationResult({
      status: 'error',
      original_address: { address_residential_indicator: 'yes' },
      matched_address: null,
      messages: [],
    })

    expect(projected.residentialIndicator).toBe('yes')
  })

  it('is unknown when the answer is absent or outside the enum', () => {
    expect(projectValidationResult({ status: 'unverified' }).residentialIndicator).toBe('unknown')
    expect(
      projectValidationResult({
        status: 'verified',
        matched_address: { address_residential_indicator: 'RESIDENTIAL' },
      }).residentialIndicator
    ).toBe('unknown')
  })
})

describe('the projected result', () => {
  it('maps the matched address onto the platform address keys', async () => {
    fetchMock.mockResolvedValue(json([VERIFIED_RESULT]))

    const result = await executeAddress('validate', { addressValidateAddress: ADDRESS })

    expect(result.matchedAddress).toEqual({
      name: 'MICKEY MOUSE',
      street1: '500 S BUENA VISTA ST',
      street2: '',
      city: 'BURBANK',
      state: 'CA',
      zipCode: '91521-0007',
      country: 'US',
      residential: 'no',
    })
  })

  it('treats only "verified" as a pass', () => {
    expect(projectValidationResult({ status: 'verified' }).isVerified).toBe(true)
    // A warning still returns a matched address. Calling it a pass is how a bad
    // address reaches a label.
    expect(projectValidationResult({ status: 'warning' }).isVerified).toBe(false)
    expect(projectValidationResult({ status: 'unverified' }).isVerified).toBe(false)
  })

  it('carries the validation messages through', () => {
    const projected = projectValidationResult({
      status: 'warning',
      messages: [
        {
          code: 'a1001',
          detail_code: 'partially_verified_to_premise_level',
          type: 'warning',
          message: 'This address has been verified down to the house/building level',
        },
      ],
    })

    expect(projected.messages).toEqual([
      {
        code: 'a1001',
        detailCode: 'partially_verified_to_premise_level',
        type: 'warning',
        message: 'This address has been verified down to the house/building level',
      },
    ])
    expect(projected.messageCount).toBe(1)
  })
})

describe('an empty response array', () => {
  it('is an upstream fault, not an empty success', async () => {
    fetchMock.mockResolvedValue(json([]))

    await expect(
      executeAddress('validate', { addressValidateAddress: ADDRESS })
    ).rejects.toBeInstanceOf(UpstreamServiceError)
  })
})

describe('an unknown operation', () => {
  it('is refused by name', async () => {
    await expect(executeAddress('create', {})).rejects.toThrow('Unknown address operation: create')
  })
})
