// src/tools/create-notion-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import createNotionPageExecute from './create-notion-page.tool.server'

export const createNotionPageTool = defineTool({
  id: 'create_notion_page',
  name: 'Create Notion page',
  description:
    'Create a new child page under an existing Notion page. Additive write — does not modify the parent. For richer content, follow up with append_notion_blocks.',
  icon: notionIcon,
  inputs: z.object({
    parentPageId: z
      .string()
      .describe('Parent page id. The page must be shared with the integration.'),
    title: z.string().describe('New page title.'),
    content: z
      .string()
      .optional()
      .describe(
        'Optional plain text body. Converted to a single paragraph block. For richer content use append_notion_blocks after creation.'
      ),
    icon: z.string().optional().describe('Optional emoji icon (e.g. 📝).'),
  }),
  outputs: z.object({
    pageId: z.string(),
    url: z.string(),
    createdTime: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createNotionPageExecute,
  agent: { toolsetSlug: 'notion.pages' },
})
