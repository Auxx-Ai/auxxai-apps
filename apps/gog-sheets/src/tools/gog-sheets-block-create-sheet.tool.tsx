// src/tools/gog-sheets-block-create-sheet.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `sheet.createSheet` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockCreateSheetExecute from './gog-sheets-block-create-sheet.tool.server'

export const googleSheetsBlockCreateSheetTool = defineTool({
  id: 'gog_sheets_block_create_sheet',
  name: 'Google Sheets: create sheet (block)',
  description: 'Internal — backs the Google Sheets block sheet.createSheet operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockCreateSheetExecute,
})
