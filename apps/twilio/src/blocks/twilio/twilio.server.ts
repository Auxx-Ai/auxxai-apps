// src/blocks/twilio/twilio.server.ts

/**
 * Block dispatcher. Routes (resource, operation) → internal tool, with a
 * small per-op transform from the block's union input shape to the tool's
 * flat input shape. The runtime injects `ctx.runTool` for block executes.
 *
 * Kept independent of `twilio.workflow.tsx` to avoid a circular import —
 * the workflow file pulls this server module in as the block's `execute`.
 * The tool ids below must stay in sync with `twilioBlock.toolMap`.
 */
const TOOL_MAP: Record<string, string> = {
  'sms.send': '_twilio_block_send_sms',
  'call.make': '_twilio_block_make_call',
}

export default async function twilioExecute(
  // biome-ignore lint/suspicious/noExplicitAny: union shape across ops
  input: any,
  // biome-ignore lint/suspicious/noExplicitAny: ctx injected by lambda runtime
  ctx: any
): Promise<Record<string, string>> {
  const { resource, operation } = input
  const key = `${resource}.${operation}`
  const toolId = TOOL_MAP[key]
  if (!toolId) {
    throw new Error(`Unknown twilio op: ${key}`)
  }

  const projected = projectInputsForOp(key, input)
  return ctx.runTool(toolId, projected)
}

// biome-ignore lint/suspicious/noExplicitAny: block union → tool flat shape
function projectInputsForOp(key: string, input: any): Record<string, unknown> {
  switch (key) {
    case 'sms.send':
      return {
        from: input.sendFrom,
        to: input.sendTo,
        body: input.sendMessage,
        asWhatsApp: input.sendToWhatsApp,
        statusCallback: input.sendStatusCallback,
      }
    case 'call.make':
      return {
        from: input.makeFrom,
        to: input.makeTo,
        message: input.makeMessage,
        useTwiml: input.makeUseTwiml,
        statusCallback: input.makeStatusCallback,
      }
    default:
      throw new Error(`No input projection for op: ${key}`)
  }
}
