// src/blocks/stripe/stripe.server.ts

import { stripeBlockToolMap } from './stripe.workflow'
import { VALID_OPERATIONS } from './resources/constants'

/**
 * Block dispatcher — projects (resource, operation) to the right internal
 * tool. The lambda runtime injects `ctx.runTool(toolId, input)`; per-op
 * internal tools live under `src/tools/internal/` and re-export the named
 * functions exposed by each resource execute file. Inputs flow through
 * as-is — the internal tools consume the existing prefixed field names
 * (e.g. `createChargeAmount`, `getCardCustomerId`) the panel already writes.
 */
export default async function stripeExecute(
  input: Record<string, any>,
  ctx: { runTool: (toolId: string, input: Record<string, any>) => Promise<Record<string, any>> }
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const key = `${resource}.${operation}`
  const toolId = stripeBlockToolMap[key]
  if (!toolId) throw new Error(`No tool mapped for ${key}`)

  return ctx.runTool(toolId, input)
}
