// src/tools/find-notion-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import findNotionPageExecute from './find-notion-page.tool.server'

export const findNotionPageTool = defineTool({
  id: 'find_notion_page',
  name: 'Find Notion page by title',
  description:
    'Find a Notion page by title. Returns the top match plus a small ranked tail for disambiguation. Use when the user names a page but you do not yet know its id.',
  icon: notionIcon,
  inputs: z.object({
    query: z
      .string()
      .describe('Page title or query text. Notion does fuzzy title matching server-side.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe(
        'Max results to return. Default 3 — enough for disambiguation without spending tokens.'
      ),
  }),
  outputs: z.object({
    found: z.boolean(),
    pages: z.array(
      z.object({
        pageId: z.string(),
        title: z.string(),
        url: z.string(),
        parentType: z.enum(['workspace', 'page', 'database', 'block']),
        parentId: z
          .string()
          .nullable()
          .describe('Parent page/database id, or null for workspace-level pages.'),
        createdTime: z.string(),
        lastEditedTime: z.string(),
      })
    ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findNotionPageExecute,
})
