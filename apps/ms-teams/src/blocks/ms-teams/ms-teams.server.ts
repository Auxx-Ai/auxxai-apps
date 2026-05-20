// src/blocks/ms-teams/ms-teams.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { msTeamsToolMap } from './ms-teams.workflow'

/**
 * Block dispatcher — projects the union input shape to the right internal
 * tool. The lambda runtime injects `ctx.runTool(toolId, input)`; per-op
 * tools live under `src/tools/internal/` and lift their bodies from the
 * resource execute branches.
 *
 * Inputs flow through as-is. The internal tools each consume the existing
 * prefixed field names (e.g. `channelCreateName`, `msgGetManyTeam`) the
 * panel already writes, so no projection is needed.
 */
export default async function msTeamsExecute(
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
  const toolId = msTeamsToolMap[key]
  if (!toolId) throw new Error(`No tool mapped for ${key}`)

  return ctx.runTool(toolId, input)
}
