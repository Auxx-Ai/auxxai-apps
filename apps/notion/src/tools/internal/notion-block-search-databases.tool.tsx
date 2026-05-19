// src/tools/internal/notion-block-search-databases.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-search-databases.tool.server'

export const notionBlockSearchDatabasesTool = defineTool({
  id: 'notion_block_search_databases',
  name: 'Notion block: search databases',
  description: 'Internal dispatcher tool for the Notion workflow block (database.search).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
