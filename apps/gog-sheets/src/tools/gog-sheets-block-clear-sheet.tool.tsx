// src/tools/gog-sheets-block-clear-sheet.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `sheet.clear` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockClearSheetExecute from './gog-sheets-block-clear-sheet.tool.server'

export const googleSheetsBlockClearSheetTool = defineTool({
  id: 'gog_sheets_block_clear_sheet',
  name: 'Google Sheets: clear sheet (block)',
  description: 'Internal — backs the Google Sheets block sheet.clear operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockClearSheetExecute,
})
