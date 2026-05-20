// src/tools/echo.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'

interface EchoInput {
  text: string
}

interface EchoOutput {
  text: string
}

export default async function echo(
  input: EchoInput,
  _ctx: ToolExecuteContext
): Promise<EchoOutput> {
  return { text: input.text }
}
