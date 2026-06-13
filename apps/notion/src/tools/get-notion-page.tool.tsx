// src/tools/get-notion-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import getNotionPageExecute from './get-notion-page.tool.server'

export const getNotionPageTool = defineTool({
  id: 'get_notion_page',
  name: 'Get Notion page',
  description:
    'Fetch full metadata for a Notion page. Does not return content blocks — use get_notion_page_content for that.',
  icon: notionIcon,
  inputs: z.object({
    pageId: z.string().describe('Notion page id (UUID).'),
  }),
  outputs: z.object({
    pageId: z.string(),
    title: z.string(),
    url: z.string(),
    icon: z.string().nullable(),
    cover: z.string().nullable().describe('External cover image URL, if set.'),
    parentType: z.enum(['workspace', 'page', 'database', 'block']),
    parentId: z.string().nullable(),
    databaseId: z
      .string()
      .nullable()
      .describe(
        'Set when the page is a row in a database — same as parentId for parentType=database.'
      ),
    properties: z
      .string()
      .describe(
        "Stringified JSON of the page's Notion-shaped properties. Opaque to the LLM; use database schema + query_notion_database for structured access."
      ),
    createdTime: z.string(),
    lastEditedTime: z.string(),
    archived: z.boolean(),
  }),
  exampleOutput: {
    pageId: '1f2e3d4c-5b6a-7980-1234-567890abcdef',
    title: 'Q3 Product Roadmap',
    url: 'https://www.notion.so/Q3-Product-Roadmap-1f2e3d4c5b6a79801234567890abcdef',
    icon: '🗺️',
    cover: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
    parentType: 'workspace',
    parentId: null,
    databaseId: null,
    properties:
      '{"title":{"id":"title","type":"title","title":[{"plain_text":"Q3 Product Roadmap"}]}}',
    createdTime: '2026-05-12T09:30:00.000Z',
    lastEditedTime: '2026-06-05T14:22:00.000Z',
    archived: false,
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getNotionPageExecute,
  agent: { toolsetSlug: 'notion.pages' },
})
