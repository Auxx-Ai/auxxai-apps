// src/tools/list-notion-databases.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import listNotionDatabasesExecute from './list-notion-databases.tool.server'

export const listNotionDatabasesTool = defineTool({
  id: 'list_notion_databases',
  name: 'List accessible Notion databases',
  description:
    'List Notion databases the connected integration can access. Use this once when the user mentions a database by name and you do not yet know its id. Notion integrations only see databases that have been explicitly shared with them.',
  icon: notionIcon,
  inputs: z.object({}),
  outputs: z.object({
    databases: z
      .array(
        z.object({
          databaseId: z
            .string()
            .describe('Notion database id (UUID). Use in subsequent tool calls.'),
          title: z.string().describe('Human-readable database title (plain text).'),
          url: z.string().describe('Notion URL to open the database in the workspace.'),
          icon: z.string().nullable().describe('Emoji or external icon URL, if set.'),
        })
      )
      .describe(
        "All databases the integration has been shared with. Empty list if no databases are shared yet — instruct the user to share a database via Notion's “Connect to” menu."
      ),
  }),
  exampleOutput: {
    databases: [
      {
        databaseId: '2a3b4c5d-6e7f-8091-a2b3-c4d5e6f70819',
        title: 'Customer Support Tickets',
        url: 'https://www.notion.so/2a3b4c5d6e7f8091a2b3c4d5e6f70819',
        icon: '🎫',
      },
      {
        databaseId: '3b4c5d6e-7f80-91a2-b3c4-d5e6f7081920',
        title: 'Product Roadmap',
        url: 'https://www.notion.so/3b4c5d6e7f8091a2b3c4d5e6f7081920',
        icon: null,
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listNotionDatabasesExecute,
  agent: {},
})
