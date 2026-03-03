// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { notionBlock } from './blocks/notion/notion.workflow'

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
