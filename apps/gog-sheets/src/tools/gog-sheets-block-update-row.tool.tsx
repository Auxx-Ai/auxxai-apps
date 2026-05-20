// src/tools/gog-sheets-block-update-row.tool.tsx

/**
 * Internal-only tool — backs the Google Sheets block's `sheet.updateRow` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleSheetsIcon from '../assets/icon.png'
import googleSheetsBlockUpdateRowExecute from './gog-sheets-block-update-row.tool.server'

export const googleSheetsBlockUpdateRowTool = defineTool({
  id: 'gog_sheets_block_update_row',
  name: 'Google Sheets: update row (block)',
  description: 'Internal — backs the Google Sheets block sheet.updateRow operation.',
  icon: googleSheetsIcon,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: googleSheetsBlockUpdateRowExecute,
})
