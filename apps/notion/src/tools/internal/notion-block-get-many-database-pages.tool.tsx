// src/tools/internal/notion-block-get-many-database-pages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-get-many-database-pages.tool.server'

export const notionBlockGetManyDatabasePagesTool = defineTool({
  id: 'notion_block_get_many_database_pages',
  name: 'Notion block: get many database pages',
  description: 'Internal dispatcher tool for the Notion workflow block (databasePage.getMany).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
