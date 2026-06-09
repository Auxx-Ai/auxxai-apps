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
  exampleOutput: {
    pageId: '6e7f8091-a2b3-c4d5-e6f7-081920304050',
    url: 'https://www.notion.so/Meeting-Notes-6e7f8091a2b3c4d5e6f7081920304050',
    createdTime: '2026-06-08T10:15:00.000Z',
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createNotionPageExecute,
  agent: { toolsetSlug: 'notion.pages' },
})
