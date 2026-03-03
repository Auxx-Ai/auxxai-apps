// src/blocks/airtable/resources/constants.ts

export const RESOURCES = [
  { value: 'record', label: 'Record' },
  { value: 'base', label: 'Base' },
] as const

export const OPERATIONS = {
  record: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'search', label: 'Search' },
    { value: 'update', label: 'Update' },
    { value: 'upsert', label: 'Upsert' },
  ],
  base: [
    { value: 'getMany', label: 'Get Many' },
    { value: 'getSchema', label: 'Get Schema' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'create', label: 'Create' },
  { value: 'delete', label: 'Delete' },
  { value: 'get', label: 'Get' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'getSchema', label: 'Get Schema' },
  { value: 'search', label: 'Search' },
  { value: 'update', label: 'Update' },
  { value: 'upsert', label: 'Upsert' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  record: ['create', 'delete', 'get', 'search', 'update', 'upsert'],
  base: ['getMany', 'getSchema'],
}

/** Airtable field types that can be written to (used for filtering field dropdowns) */
export const WRITABLE_FIELD_TYPES = new Set([
  'singleLineText',
  'multilineText',
  'richText',
  'email',
  'phoneNumber',
  'url',
  'number',
  'currency',
  'percent',
  'rating',
  'duration',
  'checkbox',
  'date',
  'dateTime',
  'singleSelect',
  'multipleSelects',
  'multipleRecordLinks',
  'multipleAttachments',
])
