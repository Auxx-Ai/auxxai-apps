// src/tools/internal/notion-block-get-block-children.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-get-block-children.tool.server'

export const notionBlockGetBlockChildrenTool = defineTool({
  id: 'notion_block_get_block_children',
  name: 'Notion block: get block children',
  description: 'Internal dispatcher tool for the Notion workflow block (block.getChildren).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
