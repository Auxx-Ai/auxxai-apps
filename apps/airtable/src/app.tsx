// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { airtableBlock } from './blocks/airtable/airtable.workflow'

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
