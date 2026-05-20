// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { airtableBlock } from './blocks/airtable/airtable.workflow'
import { airtableBlockCreateRecordTool } from './tools/block/airtable-block-create-record.tool'
import { airtableBlockDeleteRecordTool } from './tools/block/airtable-block-delete-record.tool'
import { airtableBlockGetBasesTool } from './tools/block/airtable-block-get-bases.tool'
import { airtableBlockGetRecordTool } from './tools/block/airtable-block-get-record.tool'
import { airtableBlockGetSchemaTool } from './tools/block/airtable-block-get-schema.tool'
import { airtableBlockSearchRecordsTool } from './tools/block/airtable-block-search-records.tool'
import { airtableBlockUpdateRecordTool } from './tools/block/airtable-block-update-record.tool'
import { airtableBlockUpsertRecordTool } from './tools/block/airtable-block-upsert-record.tool'
import { getAirtableBaseSchemaTool } from './tools/get-airtable-base-schema.tool'
import { listAirtableBasesTool } from './tools/list-airtable-bases.tool'
import { searchAirtableRecordsTool } from './tools/search-airtable-records.tool'
import { airtableToolsets } from './tools/toolsets'

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
    blocks: [airtableBlock],
    triggers: [],
  },
  tools: [
    // Agent-surfaced tools.
    listAirtableBasesTool,
    getAirtableBaseSchemaTool,
    searchAirtableRecordsTool,
    // Internal tools — invoked only by the Airtable block dispatcher.
    airtableBlockGetBasesTool,
    airtableBlockGetSchemaTool,
    airtableBlockCreateRecordTool,
    airtableBlockDeleteRecordTool,
    airtableBlockGetRecordTool,
    airtableBlockSearchRecordsTool,
    airtableBlockUpdateRecordTool,
    airtableBlockUpsertRecordTool,
  ],
  toolsets: airtableToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Airtable Integration</TextBlock>
      <TextBlock align="left">
        Connect your Airtable account to create, read, update, and delete records in your bases
        directly from Auxx workflows.
      </TextBlock>
    </>
  )
}
