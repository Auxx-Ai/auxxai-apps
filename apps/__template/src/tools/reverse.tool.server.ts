// src/tools/reverse.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'

interface ReverseInput {
  text: string
}

interface ReverseOutput {
  text: string
}

export default async function reverse(
  input: ReverseInput,
  _ctx: ToolExecuteContext
): Promise<ReverseOutput> {
  return { text: input.text.split('').reverse().join('') }
}
