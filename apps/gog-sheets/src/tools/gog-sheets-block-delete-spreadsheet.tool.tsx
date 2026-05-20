// src/tools/gog-sheets-block-delete-spreadsheet.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `spreadsheet.delete` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockDeleteSpreadsheetExecute from './gog-sheets-block-delete-spreadsheet.tool.server'

export const googleSheetsBlockDeleteSpreadsheetTool = defineTool({
  id: 'gog_sheets_block_delete_spreadsheet',
  name: 'Google Sheets: delete spreadsheet (block)',
  description: 'Internal — backs the Google Sheets block spreadsheet.delete operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockDeleteSpreadsheetExecute,
})
