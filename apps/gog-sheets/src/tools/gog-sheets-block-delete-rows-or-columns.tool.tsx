// src/tools/gog-sheets-block-delete-rows-or-columns.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `sheet.deleteRowsOrColumns` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockDeleteRowsOrColumnsExecute from './gog-sheets-block-delete-rows-or-columns.tool.server'

export const googleSheetsBlockDeleteRowsOrColumnsTool = defineTool({
  id: 'gog_sheets_block_delete_rows_or_columns',
  name: 'Google Sheets: delete rows or columns (block)',
  description: 'Internal — backs the Google Sheets block sheet.deleteRowsOrColumns operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockDeleteRowsOrColumnsExecute,
})
