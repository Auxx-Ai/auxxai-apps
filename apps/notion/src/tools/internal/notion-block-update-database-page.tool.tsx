// src/tools/internal/notion-block-update-database-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-update-database-page.tool.server'

export const notionBlockUpdateDatabasePageTool = defineTool({
  id: 'notion_block_update_database_page',
  name: 'Notion block: update database page',
  description: 'Internal dispatcher tool for the Notion workflow block (databasePage.update).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
