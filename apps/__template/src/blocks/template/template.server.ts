// src/blocks/template/template.server.ts

/**
 * Dispatcher for the template block. Picks the tool id off `toolMap`,
 * hands the projected input to `ctx.runTool`, and returns the tool's
 * output unchanged.
 *
 * Real apps usually project the block's union input shape (one field per
 * op, prefixed with the op name) onto the underlying tool's flat input
 * shape — see `apps/whatsapp/src/blocks/whatsapp/whatsapp.server.ts` for
 * the reference projection helper.
 */

import type { WorkflowExecuteFunction } from '@auxx/sdk'
import { templateSchema } from './template-schema'
import { templateToolMap } from './template-tool-map'

const execute: WorkflowExecuteFunction<typeof templateSchema> = async (input, ctx) => {
  const key = String(input.operation) as keyof typeof templateToolMap
  const toolId = templateToolMap[key]
  if (!toolId) {
    throw new Error(`Unknown op: ${key}`)
  }
  return ctx.runTool(toolId, { text: input.text })
}

export default execute
