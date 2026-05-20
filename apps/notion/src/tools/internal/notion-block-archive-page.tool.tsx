// src/tools/internal/notion-block-archive-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import execute from './notion-block-archive-page.tool.server'

export const notionBlockArchivePageTool = defineTool({
  id: 'notion_block_archive_page',
  name: 'Notion block: archive page',
  description: 'Internal dispatcher tool for the Notion workflow block (page.archive).',
  inputs: z.any(),
  outputs: z.any(),
  config: { requiresConnection: true, timeout: 30000 },
  execute,
})
