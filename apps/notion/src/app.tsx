// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { notionBlock } from './blocks/notion/notion.workflow'
import { appendNotionBlocksTool } from './tools/append-notion-blocks.tool'
import { createNotionDatabasePageTool } from './tools/create-notion-database-page.tool'
import { createNotionPageTool } from './tools/create-notion-page.tool'
import { findNotionDatabaseTool } from './tools/find-notion-database.tool'
import { findNotionPageTool } from './tools/find-notion-page.tool'
import { getNotionDatabaseTool } from './tools/get-notion-database.tool'
import { getNotionPageContentTool } from './tools/get-notion-page-content.tool'
import { getNotionPageTool } from './tools/get-notion-page.tool'
import { notionBlockAppendBlocksTool } from './tools/internal/notion-block-append-blocks.tool'
import { notionBlockArchivePageTool } from './tools/internal/notion-block-archive-page.tool'
import { notionBlockCreateDatabasePageTool } from './tools/internal/notion-block-create-database-page.tool'
import { notionBlockCreatePageTool } from './tools/internal/notion-block-create-page.tool'
import { notionBlockGetBlockChildrenTool } from './tools/internal/notion-block-get-block-children.tool'
import { notionBlockGetDatabasePageTool } from './tools/internal/notion-block-get-database-page.tool'
import { notionBlockGetDatabaseTool } from './tools/internal/notion-block-get-database.tool'
import { notionBlockGetManyDatabasePagesTool } from './tools/internal/notion-block-get-many-database-pages.tool'
import { notionBlockGetManyDatabasesTool } from './tools/internal/notion-block-get-many-databases.tool'
import { notionBlockGetManyUsersTool } from './tools/internal/notion-block-get-many-users.tool'
import { notionBlockGetUserTool } from './tools/internal/notion-block-get-user.tool'
import { notionBlockSearchDatabasesTool } from './tools/internal/notion-block-search-databases.tool'
import { notionBlockSearchPagesTool } from './tools/internal/notion-block-search-pages.tool'
import { notionBlockUpdateDatabasePageTool } from './tools/internal/notion-block-update-database-page.tool'
import { listNotionDatabasesTool } from './tools/list-notion-databases.tool'
import { queryNotionDatabaseTool } from './tools/query-notion-database.tool'
import { searchNotionPagesTool } from './tools/search-notion-pages.tool'
import { summarizeNotionDatabaseTool } from './tools/summarize-notion-database.tool'
import { notionToolsets } from './tools/toolsets'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },

  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },

  workflow: {
    blocks: [notionBlock],
    triggers: [],
  },

  tools: [
    // Agent-surfaced tools.
    listNotionDatabasesTool,
    findNotionPageTool,
    getNotionPageTool,
    searchNotionPagesTool,
    createNotionPageTool,
    findNotionDatabaseTool,
    getNotionDatabaseTool,
    queryNotionDatabaseTool,
    createNotionDatabasePageTool,
    summarizeNotionDatabaseTool,
    getNotionPageContentTool,
    appendNotionBlocksTool,

    // Internal-only tools backing the Notion workflow block dispatcher.
    notionBlockCreateDatabasePageTool,
    notionBlockGetDatabasePageTool,
    notionBlockGetManyDatabasePagesTool,
    notionBlockUpdateDatabasePageTool,
    notionBlockArchivePageTool,
    notionBlockCreatePageTool,
    notionBlockSearchPagesTool,
    notionBlockAppendBlocksTool,
    notionBlockGetBlockChildrenTool,
    notionBlockGetDatabaseTool,
    notionBlockGetManyDatabasesTool,
    notionBlockSearchDatabasesTool,
    notionBlockGetUserTool,
    notionBlockGetManyUsersTool,
  ],

  toolsets: notionToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Notion Integration</TextBlock>
      <TextBlock align="left">
        Connect your Notion workspace to create, read, update, and query pages and databases
        directly from Auxx workflows.
      </TextBlock>
    </>
  )
}
