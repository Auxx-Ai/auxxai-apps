// src/blocks/notion/notion.server.ts

/**
 * Workflow block dispatcher for the Notion app.
 *
 * The block's `(resource, operation)` pair is mapped via `notionToolMap` to
 * an internal tool id; the lambda runtime's `ctx.runTool(toolId, input)`
 * invokes that tool. Each internal tool simply lifts the corresponding
 * resource branch body, so block input/output behavior is preserved 1:1.
 */

import { VALID_OPERATIONS } from './resources/constants'
import { notionToolMap } from './notion-tool-map'

export default async function notionExecute(
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
  const toolId = notionToolMap[key]
  if (!toolId) {
    throw new Error(`No tool mapped for ${key}`)
  }

  return ctx.runTool(toolId, input)
}
