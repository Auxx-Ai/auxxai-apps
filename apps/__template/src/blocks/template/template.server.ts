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
import { templateBlock } from './template.workflow'

const execute: WorkflowExecuteFunction<typeof templateBlock.schema> = async (input, ctx) => {
  const key = String(input.operation)
  const toolId = (templateBlock.toolMap as Record<string, string>)[key]
  if (!toolId) {
    throw new Error(`Unknown op: ${key}`)
  }
  return ctx.runTool(toolId, { text: input.text })
}

export default execute
