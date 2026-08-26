// src/blocks/shopify/resources/capabilities.ts
//
// Pure derivation: granted scopes -> the resources and operations this connection may use.
// No SDK import, so it is directly testable and usable from both the panel and the executor.

import { resolveCapabilities } from '@auxx/sdk'
import { OPERATIONS_ALL, RESOURCES_ALL } from './constants'
import {
  ASSUMED_SCOPES_WHEN_UNKNOWN,
  OPERATION_CAPABILITY_OVERRIDES,
  RESOURCE_CAPABILITIES,
  SCOPE_GRANTS,
  WRITE_OPS,
} from './scope-grants'

export interface ConnectionCapabilities {
  /** Resource values this connection can use at all (has at least one usable operation). */
  resources: string[]
  /** Allowed operation values, keyed by resource. */
  operations: Record<string, string[]>
  /** The raw capability set, for callers that need to ask directly (e.g. order history depth). */
  capabilities: Set<string>
}

/** The capabilities one `resource.operation` pair requires. */
export function requiredCapabilities(resource: string, operation: string): readonly string[] {
  const override = OPERATION_CAPABILITY_OVERRIDES[`${resource}.${operation}`]
  if (override) return override

  const declared = RESOURCE_CAPABILITIES[resource as keyof typeof RESOURCE_CAPABILITIES]
  // Unknown resource, or one whose requirement cannot be known statically (metafield —
  // scope is inherited from the owner, which is chosen at runtime). Ungated by design.
  if (!declared || declared === 'owner-derived') return []

  return WRITE_OPS.has(operation) ? declared.write : declared.read
}

/**
 * Derive what a connection may do from the scopes it was GRANTED.
 *
 * @param grantedScope `connection.metadata.scope`. When absent, falls back to
 *   {@link ASSUMED_SCOPES_WHEN_UNKNOWN} so pre-existing connections behave exactly as they
 *   did before this mechanism existed.
 */
export function deriveCapabilities(
  grantedScope: string | undefined | null,
  onUnknownScope?: (scope: string) => void
): ConnectionCapabilities {
  const capabilities = resolveCapabilities(
    SCOPE_GRANTS,
    grantedScope?.trim() ? grantedScope : ASSUMED_SCOPES_WHEN_UNKNOWN,
    onUnknownScope
  )

  const has = (required: readonly string[]) => required.every((c) => capabilities.has(c))

  const operations: Record<string, string[]> = {}
  for (const [resource, ops] of Object.entries(OPERATIONS_ALL)) {
    const allowed = ops
      .filter((op) => has(requiredCapabilities(resource, op.value)))
      .map((op) => op.value)
    if (allowed.length > 0) operations[resource] = allowed
  }

  const resources = RESOURCES_ALL.map((r) => r.value).filter((value) => value in operations)

  return { resources, operations, capabilities }
}

/** Whether one `resource.operation` pair is permitted by a capability set. */
export function isOperationAllowed(
  capabilities: Set<string>,
  resource: string,
  operation: string
): boolean {
  return requiredCapabilities(resource, operation).every((c) => capabilities.has(c))
}
