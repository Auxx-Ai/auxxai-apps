// src/tools/shared/map-record.ts

/**
 * Tool-surface mapper for an Airtable record. Returns `fields` as a
 * `Record<string, unknown>` — Airtable schemas are user-defined, so we don't
 * type-narrow values. The LLM uses `get_airtable_base_schema` first if it
 * needs to interpret a value's type.
 */
export interface MappedAirtableRecord {
  recordId: string
  createdTime: string
  fields: Record<string, unknown>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRecord(record: any): MappedAirtableRecord {
  return {
    recordId: record.id ?? '',
    createdTime: record.createdTime ?? '',
    fields: (record.fields ?? {}) as Record<string, unknown>,
  }
}
