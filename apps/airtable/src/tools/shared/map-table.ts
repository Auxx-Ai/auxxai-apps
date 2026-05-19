// src/tools/shared/map-table.ts

/**
 * Tool-surface mapper for an Airtable table from the `/meta/bases/{baseId}/tables`
 * response. Returns structured tables, fields, and views shaped for the LLM.
 *
 * The workflow block's mapper returns flat-stringified options for dropdown
 * splicing — different consumer, different shape. Don't share.
 */

const READ_ONLY_FIELD_TYPES = new Set([
  'formula',
  'rollup',
  'lookup',
  'count',
  'autoNumber',
  'createdBy',
  'createdTime',
  'lastModifiedBy',
  'lastModifiedTime',
  'button',
  'externalSyncSource',
  'multipleLookupValues',
])

export interface MappedAirtableField {
  fieldId: string
  name: string
  type: string
  writable: boolean
}

export interface MappedAirtableView {
  viewId: string
  name: string
  type: string
}

export interface MappedAirtableTable {
  tableId: string
  name: string
  primaryFieldId: string
  fields: MappedAirtableField[]
  views: MappedAirtableView[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTable(table: any): MappedAirtableTable {
  return {
    tableId: table.id ?? '',
    name: table.name ?? '',
    primaryFieldId: table.primaryFieldId ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: (table.fields ?? []).map((f: any) => ({
      fieldId: f.id ?? '',
      name: f.name ?? '',
      type: f.type ?? '',
      writable: !READ_ONLY_FIELD_TYPES.has(f.type),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    views: (table.views ?? []).map((v: any) => ({
      viewId: v.id ?? '',
      name: v.name ?? '',
      type: v.type ?? '',
    })),
  }
}
