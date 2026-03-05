// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { googleSheetsBlock } from './blocks/google-sheets/google-sheets.workflow'
import { rowTrigger } from './blocks/google-sheets/triggers/row-trigger/row-trigger.workflow'

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
    blocks: [googleSheetsBlock],
    triggers: [rowTrigger],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">Google Sheets</TextBlock>
      <TextBlock align="left">
        Manage Google Sheets data — read rows, append data, update records, and trigger workflows
        when spreadsheet data changes.
      </TextBlock>
    </>
  )
}
