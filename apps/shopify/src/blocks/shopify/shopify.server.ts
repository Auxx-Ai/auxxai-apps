// src/blocks/shopify/shopify.server.ts
//
// Dispatcher for the `shopify` workflow block. Routes the user's
// (resource, operation) pair through `toolMap` and delegates execution to
// the matching internal tool via `ctx.runTool`. The block-shaped flat
// input is forwarded through unchanged — the internal `block_shopify_*`
// tools accept the same prefixed field names the block panel writes
// (e.g. `getOrderId`, `createEmail`), so no per-op projection is needed.

import { VALID_OPERATIONS } from './resources/constants'
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

  const key = `${resource}.${operation}`
  const toolId = (shopifyToolMap as Record<string, string>)[key]
  if (!toolId) throw new Error(`No tool mapped for ${key}`)

  return ctx.runTool(toolId, input)
}
