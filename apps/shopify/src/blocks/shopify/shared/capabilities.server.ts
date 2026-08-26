// src/blocks/shopify/shared/capabilities.server.ts

import { getConnection } from '@auxx/sdk/server'
import { type ConnectionCapabilities, deriveCapabilities } from '../resources/capabilities'

/**
 * What THIS connection may do, derived from the scopes Shopify granted its token.
 *
 * Runs server-side with the bound connection, so both callers agree by construction:
 * the panel narrows its pickers with it, and `shopifyExecute` refuses anything it excludes.
 *
 * See auxxai repo: plans/connections/scope-derived-capabilities.md
 */
export function getConnectionCapabilities(): ConnectionCapabilities {
  const connection = getConnection()
  return deriveCapabilities(connection?.metadata?.scope, (scope) => {
    // An unrecognised scope grants nothing, which presents as operations quietly
    // disappearing. Say so — this is how a renamed provider scope gets noticed.
    console.warn(`[shopify] granted scope not present in SCOPE_GRANTS: ${scope}`)
  })
}

/** Picker options for the block panel. */
export default async function loadCapabilities(): Promise<{
  resources: string[]
  operations: Record<string, string[]>
}> {
  const { resources, operations } = getConnectionCapabilities()
  return { resources, operations }
}
