// src/blocks/shopify/shopify.server.ts
//
// Dispatcher for the `shopify` workflow block. Routes the user's
// (resource, operation) pair through `toolMap` and delegates execution to
// the matching internal tool via `ctx.runTool`. The block-shaped flat
// input is forwarded through unchanged — the internal `block_shopify_*`
// tools accept the same prefixed field names the block panel writes
// (e.g. `getOrderId`, `createEmail`), so no per-op projection is needed.

import { InsufficientPermissionsError } from '@auxx/sdk/server'
import { isOperationAllowed, requiredCapabilities } from './resources/capabilities'
import { VALID_OPERATIONS } from './resources/constants'
import { getConnectionCapabilities } from './shared/capabilities.server'
import { shopifyToolMap } from './shopify-tool-map'

export default async function shopifyExecute(
  input: Record<string, any>,
  ctx: { runTool: (toolId: string, input: Record<string, any>) => Promise<Record<string, any>> }
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  // Structural validity above; PERMISSION here. Both are required: `shopifyToolMap` carries
  // every resource.operation pair and Kopilot reaches those tools without the panel ever
  // rendering, so gating only the picker would leave everything callable by an agent.
  const { capabilities } = getConnectionCapabilities()
  if (!isOperationAllowed(capabilities, resource, operation)) {
    throw new InsufficientPermissionsError(
      'organization',
      requiredCapabilities(resource, operation) as string[]
    )
  }

  const key = `${resource}.${operation}`
  const toolId = (shopifyToolMap as Record<string, string>)[key]
  if (!toolId) throw new Error(`No tool mapped for ${key}`)

  return ctx.runTool(toolId, input)
}
