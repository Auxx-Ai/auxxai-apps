// src/blocks/quickbooks/quickbooks.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { quickbooksBlockToolMap } from './quickbooks.workflow'

/**
 * Block dispatcher — projects the union input shape to the right internal
 * tool. The lambda runtime injects `ctx.runTool(toolId, input)`; per-op
 * tools live under `src/tools/internal/` and lift their bodies from the
 * resource execute branches.
 *
 * Inputs flow through as-is. The internal tools each consume the existing
 * prefixed field names the panel already writes, so no projection is needed.
 */
export default async function quickbooksExecute(
  input: Record<string, any>,
  ctx: { runTool: (toolId: string, input: Record<string, any>) => Promise<Record<string, any>> }
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const key = `${resource}.${operation}` as keyof typeof quickbooksBlockToolMap
  const toolId = quickbooksBlockToolMap[key]
  if (!toolId) throw new Error(`No tool mapped for ${key}`)

  return ctx.runTool(toolId, input)
}
