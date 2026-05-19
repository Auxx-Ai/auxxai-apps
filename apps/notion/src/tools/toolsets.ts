// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets exposed by notion. The platform projects each `id` into the
 * runtime slug namespace as `app:notion:<localId>` for agent-side filtering.
 * See plans/kopilot/apps/notion-overhaul.md §5.
 *
 * `list_notion_databases` is toolset-less — the bridge auto-attaches it when
 * any `notion.*` toolset is enabled.
 *
 * No read/write split: v1 writes are all additive (create_*, append_*), so the
 * Shopify-style "selection is the approval" split isn't load-bearing here.
 */
export const notionToolsets: Toolset[] = [
  {
    id: 'notion.pages',
    name: 'Notion pages',
    description: 'Find, inspect, and create Notion pages.',
    tools: ['find_notion_page', 'get_notion_page', 'search_notion_pages', 'create_notion_page'],
  },
  {
    id: 'notion.databases',
    name: 'Notion databases',
    description:
      'Find databases, learn schemas, query rows, create new rows, and summarize content. Most powerful surface — enable for agents that build notes, capture leads, or report on Notion-backed lists.',
    tools: [
      'find_notion_database',
      'get_notion_database',
      'query_notion_database',
      'create_notion_database_page',
      'summarize_notion_database',
    ],
  },
  {
    id: 'notion.blocks',
    name: 'Notion page content',
    description: 'Read and append text content on existing Notion pages.',
    tools: ['get_notion_page_content', 'append_notion_blocks'],
  },
]
