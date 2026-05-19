// src/blocks/slack/slack.server.ts
//
// Dispatcher for the `slack` workflow block. Routes the user's
// (resource, operation) pair through `toolMap` and delegates execution to
// the matching internal tool via `ctx.runTool`. The block-shaped flat
// input is forwarded through unchanged — the internal `slack_block_*`
// tools accept the same field names the block panel writes, so no
// per-op projection is needed.

import { VALID_OPERATIONS } from './resources/constants'
import { slackToolMap } from './slack-tool-map'

type BlockInput = Record<string, unknown>
type ToolInput = Record<string, unknown>

interface BlockExecuteContext {
  runTool: (toolId: string, input: ToolInput) => Promise<unknown>
}

export default async function slackExecute(
  input: BlockInput,
  ctx?: BlockExecuteContext
): Promise<unknown> {
  const resource = input.resource as string
  const operation = input.operation as string

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const opKey = `${resource}.${operation}`
  const toolMap = slackToolMap as Record<string, string>
  const toolId = toolMap[opKey]
  if (!toolId) {
    throw new Error(`Unknown op: ${opKey}`)
  }

  if (!ctx?.runTool) {
    throw new Error('Slack block requires lambda runtime ctx.runTool')
  }

  return ctx.runTool(toolId, input)
}
