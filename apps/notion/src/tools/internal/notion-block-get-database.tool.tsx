// src/tools/internal/notion-block-get-database.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-get-database.tool.server'

export const notionBlockGetDatabaseTool = defineTool({
  id: 'notion_block_get_database',
  name: 'Notion block: get database',
  description: 'Internal dispatcher tool for the Notion workflow block (database.get).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
