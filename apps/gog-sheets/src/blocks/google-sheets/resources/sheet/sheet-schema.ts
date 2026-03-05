// src/blocks/google-sheets/resources/sheet/sheet-schema.ts

import { Workflow } from '@auxx/sdk'

export const sheetInputs = {
  // --- Shared: Spreadsheet selector ---
  sheetSpreadsheet: Workflow.select({
    label: 'Spreadsheet',
    description: 'Spreadsheet to operate on',
    options: [] as { value: string; label: string }[],
  }),

  // --- Shared: Sheet tab selector ---
  sheetTab: Workflow.select({
    label: 'Sheet',
    description: 'Sheet tab within the spreadsheet',
    options: [] as { value: string; label: string }[],
  }),

  // --- Sheet: Append Row ---
  appendDataMode: Workflow.select({
    label: 'Data Mode',
    description: 'How to specify the row data',
    options: [
      { value: 'keyValue', label: 'Key-Value Pairs' },
      { value: 'raw', label: 'Raw Values (comma-separated)' },
    ],
    default: 'keyValue',
  }),
  appendKeyValueData: Workflow.string({
    label: 'Row Data (JSON)',
    description:
      'JSON object mapping column headers to values, e.g. {"Name": "Alice", "Email": "alice@example.com"}',
    placeholder: '{"Name": "Alice", "Email": "alice@example.com"}',
    acceptsVariables: true,
  }),
  appendRawValues: Workflow.string({
    label: 'Values',
    description: 'Comma-separated values for each column in order',
    placeholder: 'Alice, alice@example.com, 2026-03-04',
    acceptsVariables: true,
  }),
  appendCellFormat: Workflow.select({
    label: 'Cell Format',
    description: 'How values are interpreted by Google Sheets',
    options: [
      { value: 'USER_ENTERED', label: 'User Entered (Google formats)' },
      { value: 'RAW', label: 'Raw (preserve as-is)' },
    ],
    default: 'USER_ENTERED',
  }),

  // --- Sheet: Clear ---
  clearScope: Workflow.select({
    label: 'Clear',
    description: 'What to clear from the sheet',
    options: [
      { value: 'wholeSheet', label: 'Whole Sheet' },
      { value: 'specificRange', label: 'Specific Range' },
    ],
    default: 'wholeSheet',
  }),
  clearKeepFirstRow: Workflow.select({
    label: 'Keep Header Row',
    description: 'Preserve the first row (header) when clearing the whole sheet',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  clearRange: Workflow.string({
    label: 'Range',
    description: 'Range to clear in A1 notation (e.g. A2:F100)',
    placeholder: 'A2:F100',
    acceptsVariables: true,
  }),

  // --- Sheet: Create Sheet ---
  createSheetTitle: Workflow.string({
    label: 'Sheet Name',
    description: 'Name of the new sheet tab',
    placeholder: 'New Sheet',
    acceptsVariables: true,
  }),
  createSheetHidden: Workflow.select({
    label: 'Hidden',
    description: 'Hide the sheet in the UI',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  createSheetTabColor: Workflow.string({
    label: 'Tab Color',
    description: 'Tab color as hex (e.g. #0aa55c)',
    placeholder: '#0aa55c',
    acceptsVariables: true,
  }),

  // --- Sheet: Delete Rows or Columns ---
  deleteTarget: Workflow.select({
    label: 'Delete',
    description: 'What to delete',
    options: [
      { value: 'rows', label: 'Rows' },
      { value: 'columns', label: 'Columns' },
    ],
    default: 'rows',
  }),
  deleteStartIndex: Workflow.string({
    label: 'Start Index',
    description: 'Row number (starting at 1) or column letter (e.g. A) to start from',
    placeholder: '2',
    acceptsVariables: true,
  }),
  deleteCount: Workflow.string({
    label: 'Number to Delete',
    description: 'How many rows or columns to delete',
    placeholder: '1',
    acceptsVariables: true,
  }),

  // --- Sheet: Get Row(s) ---
  getRange: Workflow.string({
    label: 'Range',
    description: 'Range to read in A1 notation. Leave blank for entire sheet.',
    placeholder: 'A:Z',
    acceptsVariables: true,
  }),
  getHeaderRow: Workflow.string({
    label: 'Header Row',
    description: 'Row number containing column headers (default: 1)',
    placeholder: '1',
    acceptsVariables: true,
  }),
  getFilterColumn: Workflow.string({
    label: 'Filter Column',
    description: 'Column header name to filter by (optional)',
    placeholder: 'Email',
    acceptsVariables: true,
  }),
  getFilterValue: Workflow.string({
    label: 'Filter Value',
    description: 'Value to match in the filter column',
    placeholder: 'alice@example.com',
    acceptsVariables: true,
  }),
  getReturnFirstMatch: Workflow.select({
    label: 'Return',
    description: 'How many matching rows to return',
    options: [
      { value: 'all', label: 'All Matches' },
      { value: 'first', label: 'First Match Only' },
    ],
    default: 'all',
  }),
  getValueRender: Workflow.select({
    label: 'Value Render',
    description: 'How values are rendered in the output',
    options: [
      { value: 'UNFORMATTED_VALUE', label: 'Unformatted' },
      { value: 'FORMATTED_VALUE', label: 'Formatted' },
      { value: 'FORMULA', label: 'Formula' },
    ],
    default: 'UNFORMATTED_VALUE',
  }),
  getDateTimeRender: Workflow.select({
    label: 'DateTime Render',
    description: 'How dates are rendered in the output',
    options: [
      { value: 'FORMATTED_STRING', label: 'Formatted String' },
      { value: 'SERIAL_NUMBER', label: 'Serial Number' },
    ],
    default: 'FORMATTED_STRING',
  }),

  // --- Sheet: Update Row ---
  updateMatchColumn: Workflow.string({
    label: 'Match Column',
    description: 'Column header name to match for finding the row to update',
    placeholder: 'Email',
    acceptsVariables: true,
  }),
  updateMatchValue: Workflow.string({
    label: 'Match Value',
    description: 'Value to find in the match column',
    placeholder: 'alice@example.com',
    acceptsVariables: true,
  }),
  updateData: Workflow.string({
    label: 'Update Data (JSON)',
    description: 'JSON object mapping column headers to new values',
    placeholder: '{"Name": "Alice Updated", "Status": "Active"}',
    acceptsVariables: true,
  }),
  updateCellFormat: Workflow.select({
    label: 'Cell Format',
    description: 'How values are interpreted by Google Sheets',
    options: [
      { value: 'USER_ENTERED', label: 'User Entered (Google formats)' },
      { value: 'RAW', label: 'Raw (preserve as-is)' },
    ],
    default: 'USER_ENTERED',
  }),
  updateHeaderRow: Workflow.string({
    label: 'Header Row',
    description: 'Row number containing column headers (default: 1)',
    placeholder: '1',
    acceptsVariables: true,
  }),
}

export function sheetComputeOutputs(operation: string) {
  if (operation === 'appendRow') {
    return {
      updatedRange: Workflow.string({ label: 'Updated Range' }),
      updatedRows: Workflow.string({ label: 'Updated Rows' }),
    }
  }
  if (operation === 'clear') {
    return {
      clearedRange: Workflow.string({ label: 'Cleared Range' }),
    }
  }
  if (operation === 'createSheet') {
    return {
      sheetId: Workflow.string({ label: 'Sheet ID' }),
      title: Workflow.string({ label: 'Sheet Name' }),
    }
  }
  if (operation === 'deleteSheet') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'deleteRowsOrColumns') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getRows') {
    return {
      rows: Workflow.string({ label: 'Rows (JSON)' }),
      count: Workflow.string({ label: 'Row Count' }),
    }
  }
  if (operation === 'updateRow') {
    return {
      updatedRange: Workflow.string({ label: 'Updated Range' }),
      updatedRows: Workflow.string({ label: 'Updated Rows' }),
    }
  }
  return {}
}
