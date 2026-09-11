// src/blocks/shipstation/shipstation.server.ts

/**
 * Dispatcher for the `shipstation` workflow block.
 *
 * Routes the author's (resource, operation) pair through the tool map and
 * delegates to the matching internal tool via `ctx.runTool`. The block-shaped
 * flat input is forwarded unchanged: the internal `block_shipstation_*` tools
 * accept the same prefixed field names the panel writes, so no per-operation
 * projection is needed.
 *
 * Two checks, both required:
 *
 *  1. STRUCTURAL, from `VALID_OPERATIONS`. Does this pair exist at all?
 *  2. PERMISSION, from the installation's settings. May it run here?
 *
 * The second is not redundant with the panel narrowing its pickers.
 * `shipstationToolMap` carries every pair and Kopilot reaches those tools
 * without the panel ever rendering, so gating only the picker would leave every
 * write callable by an agent.
 */

import { InsufficientPermissionsError } from '@auxx/sdk/server'
import { isOperationAllowed, requiredCapabilities } from './resources/capabilities'
import { VALID_OPERATIONS } from './resources/constants'
import { getShipstationCapabilities } from './shared/capabilities.server'
import { shipstationToolMap } from './shipstation-tool-map'

export default async function shipstationExecute(
  input: Record<string, any>,
  ctx: { runTool: (toolId: string, input: Record<string, any>) => Promise<Record<string, any>> }
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const { capabilities } = await getShipstationCapabilities()
  if (!isOperationAllowed(capabilities, resource, operation)) {
    throw new InsufficientPermissionsError(
      'organization',
      requiredCapabilities(resource, operation) as string[]
    )
  }

  const key = `${resource}.${operation}`
  const toolId = (shipstationToolMap as Record<string, string>)[key]
  if (!toolId) throw new Error(`No tool mapped for ${key}`)

  return ctx.runTool(toolId, input)
}
