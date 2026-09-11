// src/blocks/shipstation/shared/address-schema.ts

/**
 * The shared address declarations for the ShipStation block.
 *
 * One `Workflow.address()` field per address, NOT a flat pile of street/city/
 * state inputs. The platform's address input carries paste-parse, the org's
 * default country and geocoder normalisation, and it stores the canonical
 * `AddressStruct`, so the block gets all of that for one schema key.
 *
 * ## Why `name` and `residential` are inside the address and `phone` is not
 *
 * ShipStation's `address` schema requires `name`, `phone` AND
 * `address_residential_indicator` (verified by schema composition: both
 * `ship_to` and `ship_from` are `allOf` over the same base `address`).
 *
 * `name` and `residential` were added to the canonical `AddressStruct` for
 * exactly this reason, so they live inside the field. `phone` was deliberately
 * NOT added: it is contact data that belongs on the record next to the address
 * rather than inside it. It is therefore a sibling workflow input on the two
 * operations that need it, bound from the upstream order.
 *
 * See plans/apps/shipstation/shipstation-workflow-expansion-plan.md §4 and §8.
 */

import { Workflow } from '@auxx/sdk'

/**
 * The address sub-fields a shipping address surfaces. `name` and `residential`
 * are opt-in per field at the platform level (they are not in
 * `DEFAULT_ADDRESS_COMPONENTS`), so a shipping address has to ask for them.
 */
export const SHIPPING_ADDRESS_COMPONENTS = [
  'name',
  'street1',
  'street2',
  'city',
  'state',
  'zipCode',
  'country',
  'residential',
] as const

/** A shipping address field, with the full component set ShipStation needs. */
export function shippingAddress(options: { label: string; description?: string }) {
  return Workflow.address({
    label: options.label,
    description: options.description,
    acceptsVariables: true,
    addressComponents: SHIPPING_ADDRESS_COMPONENTS,
  })
}

/**
 * The phone that must accompany a shipping address.
 *
 * Separate from the address field on purpose (see the module docblock). Bind it
 * from the upstream order rather than typing it.
 */
export function shippingPhone(options: { label: string }) {
  return Workflow.phone({
    label: options.label,
    description: 'Required by ShipStation. Bind the phone from the upstream order.',
    acceptsVariables: true,
  })
}

/**
 * How the origin of a shipment is chosen.
 *
 * The ShipStation `shipment` schema notes "Either `ship_from` or `warehouse_id`
 * must be set". A merchant shipping from one location wants the warehouse, which
 * also sidesteps the `ship_from` address (and its required phone) entirely, so
 * that is the default.
 */
export const shipFromMode = Workflow.select({
  label: 'Ship from',
  options: [
    { value: 'warehouse', label: 'A ShipStation warehouse' },
    { value: 'address', label: 'An address' },
  ],
  default: 'warehouse',
})
