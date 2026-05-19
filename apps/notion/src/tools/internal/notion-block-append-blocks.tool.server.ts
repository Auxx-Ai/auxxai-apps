// src/tools/internal/notion-block-append-blocks.tool.server.ts

import { executeBlock } from '../../blocks/notion/resources/block/block-execute.server'

export default async function notionBlockAppendBlocks(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeBlock('append', input)
}
