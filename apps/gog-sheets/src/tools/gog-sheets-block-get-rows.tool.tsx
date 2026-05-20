// src/tools/gog-sheets-block-get-rows.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `sheet.getRows` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockGetRowsExecute from './gog-sheets-block-get-rows.tool.server'

export const googleSheetsBlockGetRowsTool = defineTool({
  id: 'gog_sheets_block_get_rows',
  name: 'Google Sheets: get rows (block)',
  description: 'Internal — backs the Google Sheets block sheet.getRows operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockGetRowsExecute,
})
