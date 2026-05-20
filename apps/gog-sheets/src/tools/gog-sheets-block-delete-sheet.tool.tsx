// src/tools/gog-sheets-block-delete-sheet.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `sheet.deleteSheet` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockDeleteSheetExecute from './gog-sheets-block-delete-sheet.tool.server'

export const googleSheetsBlockDeleteSheetTool = defineTool({
  id: 'gog_sheets_block_delete_sheet',
  name: 'Google Sheets: delete sheet (block)',
  description: 'Internal — backs the Google Sheets block sheet.deleteSheet operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockDeleteSheetExecute,
})
