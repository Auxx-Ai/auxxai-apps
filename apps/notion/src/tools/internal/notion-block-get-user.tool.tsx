// src/tools/internal/notion-block-get-user.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-get-user.tool.server'

export const notionBlockGetUserTool = defineTool({
  id: 'notion_block_get_user',
  name: 'Notion block: get user',
  description: 'Internal dispatcher tool for the Notion workflow block (user.get).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
