// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { airtableBlock } from './blocks/airtable/airtable.workflow'
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
  tools: [listAirtableBasesTool, getAirtableBaseSchemaTool, searchAirtableRecordsTool],
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
