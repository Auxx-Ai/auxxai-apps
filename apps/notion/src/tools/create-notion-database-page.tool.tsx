// src/tools/create-notion-database-page.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import createNotionDatabasePageExecute from './create-notion-database-page.tool.server'

export const createNotionDatabasePageTool = defineTool({
  id: 'create_notion_database_page',
  name: 'Create Notion database row',
  description:
    'Create a new row in a Notion database with typed properties. Additive write. Call get_notion_database first to learn the schema, then construct the typed properties array.',
  icon: notionIcon,
  inputs: z.object({
    databaseId: z
      .string()
      .describe(
        'Database to add the row to. Call get_notion_database first to learn the property schema.'
      ),
    properties: z
      .array(
        z.discriminatedUnion('type', [
          z.object({ name: z.string(), type: z.literal('title'), value: z.string() }),
          z.object({ name: z.string(), type: z.literal('rich_text'), value: z.string() }),
          z.object({ name: z.string(), type: z.literal('number'), value: z.number() }),
          z.object({
            name: z.string(),
            type: z.literal('select'),
            value: z.string().describe("Option name. Must exist in the schema's options."),
          }),
          z.object({
            name: z.string(),
            type: z.literal('multi_select'),
            value: z.array(z.string()).describe('Option names. Each must exist in the schema.'),
          }),
          z.object({ name: z.string(), type: z.literal('status'), value: z.string() }),
          z.object({
            name: z.string(),
            type: z.literal('date'),
            value: z.string().describe('ISO 8601 date or date-time.'),
          }),
          z.object({ name: z.string(), type: z.literal('checkbox'), value: z.boolean() }),
          z.object({ name: z.string(), type: z.literal('url'), value: z.string() }),
          z.object({ name: z.string(), type: z.literal('email'), value: z.string() }),
          z.object({ name: z.string(), type: z.literal('phone_number'), value: z.string() }),
          z.object({
            name: z.string(),
            type: z.literal('people'),
            value: z.array(z.string()).describe('Notion user ids (UUIDs).'),
          }),
          z.object({
            name: z.string(),
            type: z.literal('relation'),
            value: z.array(z.string()).describe('Page ids in the related database.'),
          }),
          z.object({
            name: z.string(),
            type: z.literal('files'),
            value: z.array(z.string()).describe('External file URLs.'),
          }),
        ])
      )
      .describe(
        "Typed property entries. Must include the database's title property. Use get_notion_database to learn which properties are writable."
      ),
    content: z
      .string()
      .optional()
      .describe(
        'Optional plain text body. Converted to a single paragraph block. Use append_notion_blocks for richer multi-block content.'
      ),
    icon: z.string().optional().describe('Optional emoji icon.'),
  }),
  outputs: z.object({
    pageId: z.string(),
    url: z.string(),
    createdTime: z.string(),
  }),
  exampleOutput: {
    pageId: '7f8091a2-b3c4-d5e6-f708-192030405060',
    url: 'https://www.notion.so/Login-issue-on-mobile-7f8091a2b3c4d5e6f708192030405060',
    createdTime: '2026-06-08T10:20:00.000Z',
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createNotionDatabasePageExecute,
  agent: { toolsetSlug: 'notion.databases' },
})
