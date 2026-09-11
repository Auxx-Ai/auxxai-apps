// src/blocks/shipstation/resources/address/address-execute.server.ts

/**
 * Executor for the `address` resource.
 *
 * Two things about `POST /v2/addresses/validate` that are easy to get wrong and
 * are both verified against the OpenAPI document:
 *
 * 1. The request body is an ARRAY of addresses, and the response is an ARRAY of
 *    results in the same order. Sending the bare object silently fails
 *    validation upstream. This block validates exactly one address, so it wraps
 *    on the way in and unwraps on the way out.
 * 2. The required list here is only `address_line1`, `city_locality`,
 *    `state_province` and `country_code`. `phone`, `name` and even
 *    `postal_code` are optional, which is why this operation has no sibling
 *    phone input and does not reuse `missingAddressFields` from
 *    `shared/to-shipstation-address.ts` (that list is the SHIPMENT requirement
 *    and demands a phone).
 *
 * Optional empty strings are dropped rather than sent: the request schema puts
 * `minLength: 1` on `name`, `phone`, `company_name` and `address_line2`, so a
 * blank would be a 400 instead of an omission.
 */

import { InvalidInputError, UpstreamServiceError } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../../../tools/shared/connection'
import { shipstationApi } from '../../../../tools/shared/shipstation-api'
import {
  type AddressStructInput,
  type ShipstationAddress,
  toShipstationAddress,
} from '../../shared/to-shipstation-address'

/** `address_residential_indicator` is a tri-state, never a boolean. */
export type ResidentialIndicator = 'unknown' | 'yes' | 'no'

interface RawValidatedAddress {
  name?: string | null
  phone?: string | null
  company_name?: string | null
  address_line1?: string | null
  address_line2?: string | null
  address_line3?: string | null
  city_locality?: string | null
  state_province?: string | null
  postal_code?: string | null
  country_code?: string | null
  address_residential_indicator?: string | null
}

interface RawValidationMessage {
  code?: string
  detail_code?: string
  type?: string
  message?: string
}

/** One entry of the array `POST /v2/addresses/validate` answers with. */
export interface RawValidationResult {
  status?: string
  original_address?: RawValidatedAddress | null
  matched_address?: RawValidatedAddress | null
  messages?: RawValidationMessage[]
}

/**
 * What ShipStation requires to validate an address, which is a SHORTER list than
 * what it requires to ship to one. A postal code is not on it: ShipStation can
 * derive one, and demanding it here would refuse addresses it would happily
 * correct.
 */
const REQUIRED_FOR_VALIDATION: [keyof ShipstationAddress, string][] = [
  ['address_line1', 'street address'],
  ['city_locality', 'city'],
  ['state_province', 'state or province'],
  ['country_code', 'country'],
]

/** Execute one `address` operation. */
export async function executeAddress(operation: string, input: any): Promise<Record<string, any>> {
  if (operation !== 'validate') throw new Error(`Unknown address operation: ${operation}`)

  const apiKey = getShipstationApiKey()
  const address = buildValidationRequest(input.addressValidateAddress)

  // The body is an array. One address in, one result out.
  const results = await shipstationApi<RawValidationResult[]>({
    endpoint: '/addresses/validate',
    apiKey,
    method: 'POST',
    body: [address],
  })

  const result = Array.isArray(results) ? results[0] : undefined
  if (!result) {
    throw new UpstreamServiceError('ShipStation returned no address validation result.')
  }

  return projectValidationResult(result)
}

/**
 * Build the one request-array entry, dropping every optional blank.
 *
 * Exported for the tests, which assert the array wrapping and the dropped keys
 * rather than reaching through a stubbed `fetch`.
 */
export function buildValidationRequest(
  addressInput: AddressStructInput | undefined
): Record<string, unknown> {
  // No phone: `validate` does not require one, and the converter's empty string
  // would be rejected by the request schema's `minLength: 1`.
  const address = toShipstationAddress(addressInput, undefined)

  const missing = REQUIRED_FOR_VALIDATION.filter(([key]) => !String(address[key] ?? '').trim()).map(
    ([, label]) => label
  )
  if (missing.length > 0) {
    throw new InvalidInputError(`The address is missing its ${missing.join(', ')}.`)
  }

  const body: Record<string, unknown> = {
    address_line1: address.address_line1,
    city_locality: address.city_locality,
    state_province: address.state_province,
    country_code: address.country_code,
    address_residential_indicator: address.address_residential_indicator,
  }

  // Optional and `minLength: 1` upstream, so present-or-absent, never blank.
  if (address.name) body.name = address.name
  if (address.address_line2) body.address_line2 = address.address_line2
  if (address.postal_code) body.postal_code = address.postal_code

  return body
}

/** Project one validation result into the block's outputs. */
export function projectValidationResult(result: RawValidationResult): Record<string, any> {
  const matched = result.matched_address ?? {}
  const messages = (result.messages ?? []).map((message) => ({
    code: message.code ?? '',
    detailCode: message.detail_code ?? '',
    type: message.type ?? '',
    message: message.message ?? '',
  }))

  return {
    status: result.status ?? '',
    // A `warning` status still returns a matched address, so "did it pass" has
    // to mean `verified` exactly. Treating a warning as a pass is how a bad
    // address reaches a label.
    isVerified: result.status === 'verified',
    residentialIndicator: readResidentialIndicator(result),
    matchedAddress: {
      name: matched.name ?? '',
      street1: matched.address_line1 ?? '',
      street2: matched.address_line2 ?? '',
      city: matched.city_locality ?? '',
      state: matched.state_province ?? '',
      zipCode: matched.postal_code ?? '',
      country: matched.country_code ?? '',
      residential: readResidentialIndicator(result),
    },
    messages,
    messageCount: messages.length,
  }
}

/**
 * The resolved residential indicator.
 *
 * Read from the MATCHED address, falling back to the original: the matched one
 * is ShipStation's answer, while the original only echoes back whatever the
 * caller claimed. Anything outside the enum, and a missing matched address,
 * become `unknown` rather than a guessed `no`, because `no` is a commercial
 * claim that suppresses a residential surcharge.
 */
function readResidentialIndicator(result: RawValidationResult): ResidentialIndicator {
  const value =
    result.matched_address?.address_residential_indicator ??
    result.original_address?.address_residential_indicator
  if (value === 'yes' || value === 'no' || value === 'unknown') return value
  return 'unknown'
}
