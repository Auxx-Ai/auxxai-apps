// src/blocks/google-sheets/triggers/row-trigger/row-trigger-schema.ts

import { Workflow } from '@auxx/sdk'

export const rowTriggerInputs = {
  spreadsheetId: Workflow.select({
    label: 'Spreadsheet',
    description: 'Spreadsheet to watch',
    options: [] as { value: string; label: string }[],
  }),
  sheetName: Workflow.select({
    label: 'Sheet',
    description: 'Sheet tab to watch',
    options: [] as { value: string; label: string }[],
  }),
  triggerOn: Workflow.select({
    label: 'Trigger On',
    options: [
      { value: 'rowAdded', label: 'Row Added' },
      { value: 'rowUpdated', label: 'Row Updated' },
      { value: 'anyUpdate', label: 'Row Added or Updated' },
    ],
    default: 'anyUpdate',
  }),
  headerRow: Workflow.string({
    label: 'Header Row',
    description: 'Row number containing column headers (default: 1)',
    placeholder: '1',
    acceptsVariables: true,
  }),
  columnsToWatch: Workflow.string({
    label: 'Columns to Watch',
    description: 'Comma-separated column names to monitor for changes (leave blank for all)',
    placeholder: 'Name, Email, Status',
    acceptsVariables: true,
  }),
}

export const rowTriggerOutputs = {
  rowIndex: Workflow.string({ label: 'Row Index' }),
  rowData: Workflow.string({ label: 'Row Data (JSON)' }),
  changeType: Workflow.string({ label: 'Change Type' }),
}

export const rowTriggerSchema = {
  inputs: rowTriggerInputs,
  outputs: rowTriggerOutputs,
}
