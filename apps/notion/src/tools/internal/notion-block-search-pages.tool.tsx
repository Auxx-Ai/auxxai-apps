// src/tools/internal/notion-block-search-pages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-search-pages.tool.server'

export const notionBlockSearchPagesTool = defineTool({
  id: 'notion_block_search_pages',
  name: 'Notion block: search pages',
  description: 'Internal dispatcher tool for the Notion workflow block (page.search).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
