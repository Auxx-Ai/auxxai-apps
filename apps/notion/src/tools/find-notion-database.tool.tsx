// src/tools/find-notion-database.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import findNotionDatabaseExecute from './find-notion-database.tool.server'

export const findNotionDatabaseTool = defineTool({
  id: 'find_notion_database',
  name: 'Find Notion database by title',
  description:
    'Find a Notion database by title. Returns the top match(es) for disambiguation. Use when the user names a database but you do not yet know its id.',
  icon: notionIcon,
  inputs: z.object({
    query: z.string().describe('Database title or query text.'),
    limit: z.number().int().min(1).max(10).optional().describe('Default 3.'),
  }),
  outputs: z.object({
    found: z.boolean(),
    databases: z.array(
      z.object({
        databaseId: z.string(),
        title: z.string(),
        url: z.string(),
      })
    ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findNotionDatabaseExecute,
  agent: { toolsetSlug: 'notion.databases' },
})
