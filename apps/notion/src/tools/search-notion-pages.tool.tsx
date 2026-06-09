// src/tools/search-notion-pages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import searchNotionPagesExecute from './search-notion-pages.tool.server'

export const searchNotionPagesTool = defineTool({
  id: 'search_notion_pages',
  name: 'Search Notion pages',
  description:
    'Multi-result search across accessible Notion pages. Use when the user wants a list rather than a single match.',
  icon: notionIcon,
  inputs: z.object({
    query: z
      .string()
      .optional()
      .describe('Free-text search. Omit to return all accessible pages (capped to limit).'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Default 10. Hard max 50 (chat budget).'),
    sortBy: z
      .enum(['last_edited_time'])
      .optional()
      .describe('Notion only supports sorting by last_edited_time on /search.'),
    sortOrder: z
      .enum(['ascending', 'descending'])
      .optional()
      .describe('Default descending (newest edits first).'),
  }),
  outputs: z.object({
    pages: z.array(
      z.object({
        pageId: z.string(),
        title: z.string(),
        url: z.string(),
        parentType: z.enum(['workspace', 'page', 'database', 'block']),
        parentId: z.string().nullable(),
        lastEditedTime: z.string(),
      })
    ),
    truncated: z.boolean().describe('True if more results exist beyond the limit.'),
  }),
  exampleOutput: {
    pages: [
      {
        pageId: '1f2e3d4c-5b6a-7980-1234-567890abcdef',
        title: 'Q3 Product Roadmap',
        url: 'https://www.notion.so/Q3-Product-Roadmap-1f2e3d4c5b6a79801234567890abcdef',
        parentType: 'workspace',
        parentId: null,
        lastEditedTime: '2026-06-05T14:22:00.000Z',
      },
      {
        pageId: '4c5d6e7f-8091-a2b3-c4d5-e6f708192030',
        title: 'Onboarding Guide',
        url: 'https://www.notion.so/Onboarding-Guide-4c5d6e7f8091a2b3c4d5e6f708192030',
        parentType: 'page',
        parentId: '5d6e7f80-91a2-b3c4-d5e6-f70819203040',
        lastEditedTime: '2026-06-02T11:05:00.000Z',
      },
    ],
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchNotionPagesExecute,
  agent: { toolsetSlug: 'notion.pages' },
})
