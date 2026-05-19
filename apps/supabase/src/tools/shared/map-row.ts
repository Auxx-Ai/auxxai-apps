// src/tools/shared/map-row.ts

/**
 * Pass-through mapper for a Supabase row. PostgREST returns column→value
 * objects with no nested envelope, so the tool-side mapper is mostly
 * defensive: filter non-objects and surface a stable type.
 *
 * Schemas are user-defined; we don't type-narrow values. The LLM uses
 * `get_supabase_table_schema` first if it needs to interpret a value.
 */

export type MappedSupabaseRow = Record<string, unknown>

export function mapRow(row: unknown): MappedSupabaseRow {
  if (row && typeof row === 'object' && !Array.isArray(row)) {
    return row as MappedSupabaseRow
  }
  return {}
}
