// src/blocks/google-sheets/resources/spreadsheet/spreadsheet-schema.ts

import { Workflow } from '@auxx/sdk'

export const spreadsheetInputs = {
  // --- Spreadsheet: Create ---
  createTitle: Workflow.string({
    label: 'Title',
    description: 'Title of the new spreadsheet',
    placeholder: 'My Spreadsheet',
    acceptsVariables: true,
  }),
  createLocale: Workflow.string({
    label: 'Locale',
    description: 'Spreadsheet locale (e.g. en_US). Affects formatting and formula behavior.',
    placeholder: 'en_US',
    acceptsVariables: true,
  }),
  createAutoRecalc: Workflow.select({
    label: 'Auto Recalculation',
    description: 'How often volatile functions are recalculated',
    options: [
      { value: '', label: 'Default' },
      { value: 'ON_CHANGE', label: 'On Change' },
      { value: 'MINUTE', label: 'Every Minute' },
      { value: 'HOUR', label: 'Every Hour' },
    ],
    default: '',
  }),
  createSheetTitles: Workflow.string({
    label: 'Initial Sheet Names',
    description: 'Comma-separated names for initial sheets (leave blank for default "Sheet1")',
    placeholder: 'Sheet1, Sheet2',
    acceptsVariables: true,
  }),

  // --- Spreadsheet: Delete ---
  deleteSpreadsheetId: Workflow.string({
    label: 'Spreadsheet ID',
    description: 'ID of the spreadsheet to delete (from the URL)',
    placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
    acceptsVariables: true,
  }),
}

export function spreadsheetComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      spreadsheetId: Workflow.string({ label: 'Spreadsheet ID' }),
      spreadsheetUrl: Workflow.string({ label: 'Spreadsheet URL' }),
      title: Workflow.string({ label: 'Title' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  return {}
}
