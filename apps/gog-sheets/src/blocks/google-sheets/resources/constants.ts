// src/blocks/google-sheets/resources/constants.ts

export const RESOURCES = [
  { value: 'spreadsheet', label: 'Spreadsheet' },
  { value: 'sheet', label: 'Sheet' },
] as const

export const OPERATIONS = {
  spreadsheet: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
  ],
  sheet: [
    { value: 'appendRow', label: 'Append Row' },
    { value: 'clear', label: 'Clear' },
    { value: 'createSheet', label: 'Create Sheet' },
    { value: 'deleteSheet', label: 'Delete Sheet' },
    { value: 'deleteRowsOrColumns', label: 'Delete Rows or Columns' },
    { value: 'getRows', label: 'Get Row(s)' },
    { value: 'updateRow', label: 'Update Row' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'create', label: 'Create' },
  { value: 'delete', label: 'Delete' },
  { value: 'appendRow', label: 'Append Row' },
  { value: 'clear', label: 'Clear' },
  { value: 'createSheet', label: 'Create Sheet' },
  { value: 'deleteSheet', label: 'Delete Sheet' },
  { value: 'deleteRowsOrColumns', label: 'Delete Rows or Columns' },
  { value: 'getRows', label: 'Get Row(s)' },
  { value: 'updateRow', label: 'Update Row' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  spreadsheet: ['create', 'delete'],
  sheet: [
    'appendRow',
    'clear',
    'createSheet',
    'deleteSheet',
    'deleteRowsOrColumns',
    'getRows',
    'updateRow',
  ],
}
