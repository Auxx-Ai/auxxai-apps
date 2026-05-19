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
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchNotionPagesExecute,
})
