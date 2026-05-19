// src/tools/internal/notion-block-get-block-children.tool.server.ts

import { executeBlock } from '../../blocks/notion/resources/block/block-execute.server'

export default async function notionBlockGetBlockChildren(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeBlock('getChildren', input)
}
