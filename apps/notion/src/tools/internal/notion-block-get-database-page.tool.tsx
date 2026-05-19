// src/tools/internal/notion-block-get-database-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-get-database-page.tool.server'

export const notionBlockGetDatabasePageTool = defineTool({
  id: 'notion_block_get_database_page',
  name: 'Notion block: get database page',
  description: 'Internal dispatcher tool for the Notion workflow block (databasePage.get).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
