// src/tools/internal/notion-block-create-database-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-create-database-page.tool.server'

export const notionBlockCreateDatabasePageTool = defineTool({
  id: 'notion_block_create_database_page',
  name: 'Notion block: create database page',
  description: 'Internal dispatcher tool for the Notion workflow block (databasePage.create).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
