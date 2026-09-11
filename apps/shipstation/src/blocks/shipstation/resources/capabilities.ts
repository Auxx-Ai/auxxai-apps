// src/blocks/shipstation/resources/capabilities.ts

/**
 * Pure derivation: app settings -> the resources and operations this
 * installation may use. No SDK import, so it is directly testable and usable
 * from both the panel and the executor.
 *
 * ## Why settings and not scopes
 *
 * The Shopify block derives this from the OAuth scopes its token was granted.
 * ShipStation V2 authenticates with a single long-lived API key that carries no
 * scope information at all, so that seam has nothing to read. The equivalent
 * here is an explicit choice the org makes: see `src/app.settings.ts`.
 *
 * ## Why two flags
 *
 * `allowLabelPurchase` is separate from `allowWrites` because purchasing a
 * label is the only operation in this block that spends money. An org that
 * wants workflows to tag shipments and issue return labels should not have to
 * also authorise buying outbound postage.
 *
 * `label.void` deliberately sits under `allowWrites`, NOT under
 * `allowLabelPurchase`: voiding requests a refund and is the corrective action
 * for a mistaken purchase. Tying it to the purchase flag would leave an org
 * able to buy and unable to undo.
 *
 * Both default to false. A fresh installation is read-only.
 */

import { OPERATIONS_ALL, RESOURCES_ALL } from './constants'

/** The capability tokens an operation can require. */
export type ShipstationCapability = 'write' | 'purchase'

/** The installation settings this derivation reads. */
export interface ShipstationSettings {
  allowWrites?: boolean
  allowLabelPurchase?: boolean
}

export interface ConnectionCapabilities {
  /** Resource values usable at all (at least one permitted operation). */
  resources: string[]
  /** Allowed operation values, keyed by resource. */
  operations: Record<string, string[]>
  /** The raw capability set, for callers that need to ask directly. */
  capabilities: Set<ShipstationCapability>
}

/**
 * Operations that mutate ShipStation state. Everything absent from this set is
 * a read and is always permitted.
 *
 * `getMany`, `get`, `track`, `estimate`, `getForShipment`, `getServices`,
 * `getPackageTypes` and `validate` are all reads. `validate` is a POST because
 * the address goes in the body, which is why membership here is by intent
 * rather than by HTTP verb.
 */
const WRITE_OPS: ReadonlySet<string> = new Set([
  'create',
  'update',
  'cancel',
  'addTag',
  'removeTag',
  'addNote',
  'void',
  'createReturn',
])

/** Pairs whose requirement is not simply "is it a write". */
const OPERATION_CAPABILITY_OVERRIDES: Record<string, readonly ShipstationCapability[]> = {
  // Spends money. Its own flag.
  'label.create': ['purchase'],
  // Corrective action for a mistaken purchase, so it must not need `purchase`.
  'label.void': ['write'],
}

/** The capabilities one `resource.operation` pair requires. Empty means always allowed. */
export function requiredCapabilities(
  resource: string,
  operation: string
): readonly ShipstationCapability[] {
  const override = OPERATION_CAPABILITY_OVERRIDES[`${resource}.${operation}`]
  if (override) return override
  return WRITE_OPS.has(operation) ? ['write'] : []
}

/** Derive what this installation may do from its settings. */
export function deriveCapabilities(
  settings: ShipstationSettings | undefined
): ConnectionCapabilities {
  const capabilities = new Set<ShipstationCapability>()
  if (settings?.allowWrites) capabilities.add('write')
  if (settings?.allowLabelPurchase) capabilities.add('purchase')

  const operations: Record<string, string[]> = {}
  for (const { value: resource } of RESOURCES_ALL) {
    const ops = OPERATIONS_ALL[resource as keyof typeof OPERATIONS_ALL]
    operations[resource] = ops
      .map((op) => op.value as string)
      .filter((operation) => hasAll(capabilities, requiredCapabilities(resource, operation)))
  }

  return {
    resources: RESOURCES_ALL.map((r) => r.value as string).filter(
      (resource) => operations[resource].length > 0
    ),
    operations,
    capabilities,
  }
}

/** Is this pair permitted under the given capability set? */
export function isOperationAllowed(
  capabilities: Set<ShipstationCapability>,
  resource: string,
  operation: string
): boolean {
  return hasAll(capabilities, requiredCapabilities(resource, operation))
}

function hasAll(
  capabilities: Set<ShipstationCapability>,
  required: readonly ShipstationCapability[]
): boolean {
  return required.every((capability) => capabilities.has(capability))
}
