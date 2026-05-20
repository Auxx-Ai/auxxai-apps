// src/tools/gog-sheets-block-create-spreadsheet.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `spreadsheet.create` op.
 * No `agent` / `action` surface keys: invoked solely via the block's dispatcher
 * through `ctx.runTool`.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockCreateSpreadsheetExecute from './gog-sheets-block-create-spreadsheet.tool.server'

export const googleSheetsBlockCreateSpreadsheetTool = defineTool({
  id: 'gog_sheets_block_create_spreadsheet',
  name: 'Google Sheets: create spreadsheet (block)',
  description: 'Internal — backs the Google Sheets block spreadsheet.create operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockCreateSpreadsheetExecute,
})
