// src/tools/get-notion-database.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import getNotionDatabaseExecute from './get-notion-database.tool.server'

export const getNotionDatabaseTool = defineTool({
  id: 'get_notion_database',
  name: 'Get Notion database (with schema)',
  description:
    'Fetch a Notion database with its full property schema. Call this before create_notion_database_page to learn which properties exist, their types, and the allowed options for select / multi_select / status fields.',
  icon: notionIcon,
  inputs: z.object({
    databaseId: z.string(),
  }),
  outputs: z.object({
    databaseId: z.string(),
    title: z.string(),
    url: z.string(),
    properties: z
      .array(
        z.object({
          name: z.string().describe('Property name (the user-visible column header).'),
          type: z
            .string()
            .describe(
              'Notion property type (title, rich_text, number, select, multi_select, status, date, checkbox, url, email, phone_number, people, relation, files, formula, rollup, created_time, created_by, last_edited_time, last_edited_by, unique_id, verification).'
            ),
          options: z
            .array(z.string())
            .nullable()
            .describe(
              'Allowed option names for select / multi_select / status. Null for other types.'
            ),
          writable: z
            .boolean()
            .describe(
              'True if the property can be set via create_notion_database_page. False for formula / rollup / created_time / created_by / last_edited_time / last_edited_by / unique_id / verification.'
            ),
        })
      )
      .describe(
        'Property schema. The LLM uses this to construct typed properties for create_notion_database_page.'
      ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getNotionDatabaseExecute,
  agent: { toolsetSlug: 'notion.databases' },
})
