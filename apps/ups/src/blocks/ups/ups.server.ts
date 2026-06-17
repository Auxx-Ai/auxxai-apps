// src/blocks/ups/ups.server.ts
//
// Dispatcher for the `ups` workflow block. Routes the (resource, operation)
// pair through `upsToolMap` and delegates to the matching internal tool via
// `ctx.runTool`. The block-shaped flat input is forwarded unchanged — the
// `ups_block_*` tools read the same field names the panel writes, so no per-op
// projection is needed.

import { upsToolMap } from './ups-tool-map'
import { VALID_OPERATIONS } from './constants'

type BlockInput = Record<string, unknown>
type ToolOutput = Record<string, unknown>

interface BlockExecuteContext {
  runTool: (toolId: string, input: BlockInput) => Promise<ToolOutput>
}

export default async function upsExecute(
  input: BlockInput,
  ctx?: BlockExecuteContext
): Promise<ToolOutput> {
  const resource = input.resource as string
  const operation = input.operation as string

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const toolId = (upsToolMap as Record<string, string>)[`${resource}.${operation}`]
  if (!toolId) throw new Error(`Unknown op: ${resource}.${operation}`)

  if (!ctx?.runTool) {
    throw new Error('UPS block requires lambda runtime ctx.runTool')
  }

  return ctx.runTool(toolId, input)
}
