// src/tools/internal/notion-block-append-blocks.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-append-blocks.tool.server'

export const notionBlockAppendBlocksTool = defineTool({
  id: 'notion_block_append_blocks',
  name: 'Notion block: append blocks',
  description: 'Internal dispatcher tool for the Notion workflow block (block.append).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
