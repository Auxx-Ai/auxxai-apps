// src/tools/summarize-notion-database.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import notionIcon from '../assets/icon.png'
import summarizeNotionDatabaseExecute from './summarize-notion-database.tool.server'

export const summarizeNotionDatabaseTool = defineTool({
  id: 'summarize_notion_database',
  name: 'Summarize Notion database',
  description:
    'Walk a Notion database — query rows, optionally fetch each row’s content blocks, and return an aggregated summary. Streams per-page progress as the walk proceeds.',
  icon: notionIcon,
  inputs: z.object({
    databaseId: z.string(),
    filter: z
      .object({
        propertyName: z.string(),
        condition: z.string(),
        value: z.string().optional(),
      })
      .optional()
      .describe('Same shape as query_notion_database.filter.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .describe(
        'Default 10. Hard max 25 — chat budget; each page costs an extra API call for blocks.'
      ),
    includeBlocks: z
      .boolean()
      .optional()
      .describe(
        "Default true. When true, fetches each page's top-level blocks for the summary. Disable to summarize properties only (single API call total)."
      ),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe(
        'LLM-readable rollup: total pages, key properties, content excerpts. Generated server-side from the aggregated payload.'
      ),
    pages: z.array(
      z.object({
        pageId: z.string(),
        title: z.string(),
        url: z.string(),
        propertiesPreview: z
          .string()
          .describe("Compact one-line summary of the row's key properties."),
        contentPreview: z
          .string()
          .describe("First ~500 chars of the page's text content. Empty when includeBlocks=false."),
      })
    ),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    summary:
      '12 tickets total. 4 open, 5 in progress, 3 resolved. High-priority items cluster around mobile login and checkout failures. Most recent activity on the mobile login ticket.',
    pages: [
      {
        pageId: '7f8091a2-b3c4-d5e6-f708-192030405060',
        title: 'Login issue on mobile',
        url: 'https://www.notion.so/Login-issue-on-mobile-7f8091a2b3c4d5e6f708192030405060',
        propertiesPreview: 'Status: In Progress · Priority: High · Tags: bug, mobile',
        contentPreview:
          'User reports being unable to log in on iOS Safari after the latest release. Repro steps attached; appears related to the new session cookie flag.',
      },
    ],
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 60000,
  },
  execute: summarizeNotionDatabaseExecute,
  agent: { toolsetSlug: 'notion.databases' },
})
