// src/tools/internal/notion-block-get-many-databases.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-get-many-databases.tool.server'

export const notionBlockGetManyDatabasesTool = defineTool({
  id: 'notion_block_get_many_databases',
  name: 'Notion block: get many databases',
  description: 'Internal dispatcher tool for the Notion workflow block (database.getMany).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
