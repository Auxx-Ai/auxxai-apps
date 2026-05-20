// src/blocks/google-sheets/google-sheets-tool-map.ts
//
// Dispatch table — maps `${resource}.${operation}` keys from the block
// schema to the tool id that executes the op. Lives in a plain .ts file
// (not the .workflow.tsx) so the server-side dispatcher can import it
// without dragging in the React/client surface. See plans/kopilot/agents/
// triggers/app-surface-per-app-migration.md §2.5.

export const googleSheetsToolMap = {
  'spreadsheet.create': 'gog_sheets_block_create_spreadsheet',
  'spreadsheet.delete': 'gog_sheets_block_delete_spreadsheet',
  'sheet.appendRow': 'gog_sheets_block_append_row',
  'sheet.clear': 'gog_sheets_block_clear_sheet',
  'sheet.createSheet': 'gog_sheets_block_create_sheet',
  'sheet.deleteSheet': 'gog_sheets_block_delete_sheet',
  'sheet.deleteRowsOrColumns': 'gog_sheets_block_delete_rows_or_columns',
  'sheet.getRows': 'gog_sheets_block_get_rows',
  'sheet.updateRow': 'gog_sheets_block_update_row',
} as const

export type GoogleSheetsToolMap = typeof googleSheetsToolMap
