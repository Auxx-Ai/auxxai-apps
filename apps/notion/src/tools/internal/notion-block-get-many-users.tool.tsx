// src/tools/internal/notion-block-get-many-users.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-get-many-users.tool.server'

export const notionBlockGetManyUsersTool = defineTool({
  id: 'notion_block_get_many_users',
  name: 'Notion block: get many users',
  description: 'Internal dispatcher tool for the Notion workflow block (user.getMany).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
