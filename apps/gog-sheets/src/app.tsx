// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { googleSheetsBlock } from './blocks/google-sheets/google-sheets.workflow'
import { rowTrigger } from './blocks/google-sheets/triggers/row-trigger/row-trigger.workflow'
import { googleSheetsBlockAppendRowTool } from './tools/gog-sheets-block-append-row.tool'
import { googleSheetsBlockClearSheetTool } from './tools/gog-sheets-block-clear-sheet.tool'
import { googleSheetsBlockCreateSheetTool } from './tools/gog-sheets-block-create-sheet.tool'
import { googleSheetsBlockCreateSpreadsheetTool } from './tools/gog-sheets-block-create-spreadsheet.tool'
import { googleSheetsBlockDeleteRowsOrColumnsTool } from './tools/gog-sheets-block-delete-rows-or-columns.tool'
import { googleSheetsBlockDeleteSheetTool } from './tools/gog-sheets-block-delete-sheet.tool'
import { googleSheetsBlockDeleteSpreadsheetTool } from './tools/gog-sheets-block-delete-spreadsheet.tool'
import { googleSheetsBlockGetRowsTool } from './tools/gog-sheets-block-get-rows.tool'
import { googleSheetsBlockUpdateRowTool } from './tools/gog-sheets-block-update-row.tool'

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
  tools: [
    // Internal-only tools — invoked solely by the Google Sheets block dispatcher.
    googleSheetsBlockCreateSpreadsheetTool,
    googleSheetsBlockDeleteSpreadsheetTool,
    googleSheetsBlockAppendRowTool,
    googleSheetsBlockClearSheetTool,
    googleSheetsBlockCreateSheetTool,
    googleSheetsBlockDeleteSheetTool,
    googleSheetsBlockDeleteRowsOrColumnsTool,
    googleSheetsBlockGetRowsTool,
    googleSheetsBlockUpdateRowTool,
  ],
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
