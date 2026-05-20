// src/tools/gog-sheets-block-append-row.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `sheet.appendRow` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockAppendRowExecute from './gog-sheets-block-append-row.tool.server'

export const googleSheetsBlockAppendRowTool = defineTool({
  id: 'gog_sheets_block_append_row',
  name: 'Google Sheets: append row (block)',
  description: 'Internal — backs the Google Sheets block sheet.appendRow operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockAppendRowExecute,
})
