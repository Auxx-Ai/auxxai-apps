// src/blocks/shipstation/resources/constants.ts

/**
 * The ShipStation block's resource / operation surface.
 *
 * 23 operations across 7 resources, chosen deliberately rather than
 * exhaustively: the ShipStation V2 API has 169 operations and this app exposes
 * about an eighth of them. See
 * plans/apps/shipstation/shipstation-workflow-expansion-plan.md §6 for the
 * matrix and §1 "Not in scope" for what was left out and why.
 *
 * This file is the SINGLE source of the surface. `VALID_OPERATIONS` is derived
 * from `OPERATIONS`, never hand-maintained, so a resource cannot advertise an
 * operation the dispatcher does not know about.
 */

export const RESOURCES_ALL = [
  { value: 'shipment', label: 'Shipment' },
  { value: 'label', label: 'Label' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'rate', label: 'Rate' },
  { value: 'carrier', label: 'Carrier' },
  { value: 'address', label: 'Address' },
  { value: 'fulfillment', label: 'Fulfillment' },
] as const

export const OPERATIONS_ALL = {
  shipment: [
    { value: 'getMany', label: 'Get Many' },
    { value: 'get', label: 'Get' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'cancel', label: 'Cancel' },
    { value: 'addTag', label: 'Add Tag' },
    { value: 'removeTag', label: 'Remove Tag' },
    { value: 'addNote', label: 'Add Internal Note' },
  ],
  label: [
    { value: 'getMany', label: 'Get Many' },
    { value: 'get', label: 'Get' },
    { value: 'create', label: 'Purchase' },
    { value: 'void', label: 'Void' },
    { value: 'createReturn', label: 'Create Return Label' },
    { value: 'track', label: 'Track (master)' },
  ],
  tracking: [{ value: 'get', label: 'Get' }],
  rate: [
    { value: 'estimate', label: 'Estimate' },
    { value: 'getMany', label: 'Get Rates' },
    { value: 'getForShipment', label: 'Get Rates for Shipment' },
  ],
  carrier: [
    { value: 'getMany', label: 'Get Many' },
    { value: 'getServices', label: 'Get Services' },
    { value: 'getPackageTypes', label: 'Get Package Types' },
  ],
  address: [{ value: 'validate', label: 'Validate' }],
  fulfillment: [{ value: 'getMany', label: 'Get Many' }],
} as const

/**
 * The flat union the block schema advertises. A `Workflow.select` needs one
 * option list, so this is every operation value across every resource; the
 * panel narrows it per resource from {@link OPERATIONS}.
 */
const ALL_OPERATIONS_ALL = [
  { value: 'getMany', label: 'Get Many' },
  { value: 'get', label: 'Get' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'cancel', label: 'Cancel' },
  { value: 'addTag', label: 'Add Tag' },
  { value: 'removeTag', label: 'Remove Tag' },
  { value: 'addNote', label: 'Add Internal Note' },
  { value: 'void', label: 'Void' },
  { value: 'createReturn', label: 'Create Return Label' },
  { value: 'track', label: 'Track (master)' },
  { value: 'estimate', label: 'Estimate' },
  { value: 'getForShipment', label: 'Get Rates for Shipment' },
  { value: 'getServices', label: 'Get Services' },
  { value: 'getPackageTypes', label: 'Get Package Types' },
  { value: 'validate', label: 'Validate' },
] as const

/** Resource picker options (full surface; narrowed per installation by the panel). */
export const RESOURCES = RESOURCES_ALL

/** Operation options per resource (full surface; narrowed per installation by the panel). */
export const OPERATIONS = OPERATIONS_ALL as unknown as Record<
  string,
  { value: string; label: string }[]
>

/** The flat union the block schema advertises. */
export const ALL_OPERATIONS = ALL_OPERATIONS_ALL

/**
 * Structural validity: does this `resource.operation` pair exist at all?
 * Derived, never hand-maintained.
 *
 * Says nothing about whether the installation is PERMITTED to run it; that is
 * `capabilities.ts`, and `shipstationExecute` checks both. Both are required:
 * the tool map carries every pair and Kopilot reaches those tools without the
 * panel ever rendering, so gating only the picker would leave every write
 * callable by an agent.
 */
export const VALID_OPERATIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(OPERATIONS).map(([resource, ops]) => [resource, ops.map((op) => op.value)])
)
