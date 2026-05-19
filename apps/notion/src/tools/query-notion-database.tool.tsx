// src/tools/query-notion-database.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import queryNotionDatabaseExecute from './query-notion-database.tool.server'

export const queryNotionDatabaseTool = defineTool({
  id: 'query_notion_database',
  name: 'Query Notion database',
  description:
    'Filter and sort rows in a Notion database. The chat-shaped equivalent of get-many. Call get_notion_database first to learn property names and types.',
  icon: notionIcon,
  inputs: z
    .object({
      databaseId: z.string(),
      filter: z
        .object({
          propertyName: z
            .string()
            .describe('Property to filter by. Must exist in the database schema.'),
          condition: z
            .string()
            .describe(
              "Condition for the property's type (e.g. equals, contains, greater_than, before, is_empty). See get_notion_database to learn the property type."
            ),
          value: z.string().optional().describe('Filter value. Omit for is_empty / is_not_empty.'),
        })
        .optional()
        .describe('Single-condition filter. For compound filters (AND/OR) use the workflow block.'),
      sort: z
        .object({
          propertyName: z
            .string()
            .optional()
            .describe('Property to sort by. Omit to sort by timestamp.'),
          timestamp: z
            .enum(['created_time', 'last_edited_time'])
            .optional()
            .describe('Sort by row timestamp instead of a property. Set this OR propertyName.'),
          direction: z.enum(['ascending', 'descending']).optional().describe('Default ascending.'),
        })
        .optional(),
      limit: z.number().int().min(1).max(100).optional().describe('Default 25. Hard max 100.'),
    })
    .refine((v) => !v.sort || Boolean(v.sort.propertyName) !== Boolean(v.sort.timestamp), {
      message: 'sort must specify exactly one of propertyName or timestamp.',
    }),
  outputs: z.object({
    pages: z.array(
      z.object({
        pageId: z.string(),
        url: z.string(),
        title: z.string().describe("Resolved from the database's title property."),
        properties: z
          .array(
            z.object({
              name: z.string(),
              type: z.string(),
              value: z
                .string()
                .describe(
                  'Stringified value. Numbers/booleans/dates serialized as strings; multi-value types (multi_select, people, relation) comma-joined.'
                ),
            })
          )
          .describe(
            'Flat property list. Schema is per-database; the LLM correlates with get_notion_database to interpret types.'
          ),
        createdTime: z.string(),
        lastEditedTime: z.string(),
      })
    ),
    truncated: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: queryNotionDatabaseExecute,
  agent: { toolsetSlug: 'notion.databases' },
})
