// src/tools/internal/notion-block-create-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-create-page.tool.server'

export const notionBlockCreatePageTool = defineTool({
  id: 'notion_block_create_page',
  name: 'Notion block: create page',
  description: 'Internal dispatcher tool for the Notion workflow block (page.create).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
