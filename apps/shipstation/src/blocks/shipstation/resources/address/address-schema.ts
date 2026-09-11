// src/blocks/shipstation/resources/address/address-schema.ts

/**
 * The `address` resource: one operation, `validate`.
 *
 * This is where `residential` gets ANSWERED. Every other operation in this block
 * can only carry `address_residential_indicator` around; ShipStation resolves it
 * here, and the answer drives a carrier surcharge, so it is a first-class output
 * rather than a field buried inside the normalized address.
 *
 * Input is ONE `Workflow.address()` field. Unlike shipment and label creation,
 * `POST /v2/addresses/validate` does NOT require a phone (its required list is
 * `address_line1`, `city_locality`, `state_province`, `country_code` only), so
 * this operation has no sibling phone input.
 */

import { Workflow } from '@auxx/sdk'
import { shippingAddress } from '../../shared/address-schema'

export const addressInputs = {
  // --- Address: Validate ---
  addressValidateAddress: shippingAddress({
    label: 'Address',
    description:
      'The address to validate. ShipStation requires a street, city, state or province and country. A phone is not needed here.',
  }),
}

/**
 * The normalized address ShipStation matched, in the platform's own
 * `AddressStruct` key names so it binds straight back into another
 * `Workflow.address()` field on a later node.
 */
const matchedAddressFields = {
  name: Workflow.string({ label: 'name' }),
  street1: Workflow.string({ label: 'street1' }),
  street2: Workflow.string({ label: 'street2' }),
  city: Workflow.string({ label: 'city' }),
  state: Workflow.string({ label: 'state' }),
  zipCode: Workflow.string({ label: 'zipCode' }),
  country: Workflow.string({ label: 'country' }),
  residential: Workflow.string({ label: 'residential' }),
}

const messageFields = {
  code: Workflow.string({ label: 'code' }),
  detailCode: Workflow.string({ label: 'detailCode' }),
  type: Workflow.string({ label: 'type' }),
  message: Workflow.string({ label: 'message' }),
}

/** The variables `address.validate` publishes downstream. */
export function addressComputeOutputs(operation: string) {
  if (operation === 'validate') {
    return {
      status: Workflow.string({
        label: 'status',
        description: 'One of verified, unverified, warning or error.',
      }),
      isVerified: Workflow.boolean({
        label: 'isVerified',
        description: 'True only for status "verified". A "warning" is not a pass.',
      }),
      residentialIndicator: Workflow.string({
        label: 'residentialIndicator',
        description:
          'unknown, yes or no. Drives a carrier residential surcharge; "unknown" is a real answer, not a "no".',
      }),
      matchedAddress: Workflow.struct(matchedAddressFields, { label: 'matchedAddress' }),
      messages: Workflow.array({
        label: 'messages',
        items: Workflow.struct(messageFields, { label: 'message' }),
      }),
      messageCount: Workflow.number({ label: 'messageCount', integer: true }),
    }
  }
  return {}
}
