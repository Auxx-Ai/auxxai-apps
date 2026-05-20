// src/tools/ping.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'

interface PingInput {
  message: string
}

interface PingOutput {
  reply: string
  receivedAt: string
}

export default async function ping(
  input: PingInput,
  _ctx: ToolExecuteContext
): Promise<PingOutput> {
  return {
    reply: `pong: ${input.message}`,
    receivedAt: new Date().toISOString(),
  }
}
