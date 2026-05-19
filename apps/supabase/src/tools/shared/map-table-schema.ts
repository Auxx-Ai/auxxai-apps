// src/tools/shared/map-table-schema.ts

/**
 * Map a PostgREST OpenAPI table definition into the tool's column shape.
 *
 * PostgREST emits per-column metadata under `definitions[table].properties`
 * and a `required` list at the definition root. Primary keys are surfaced
 * in the `description` field as "Note: This is a Primary Key."
 */

export interface MappedColumn {
  name: string
  type: string
  format?: string
  nullable: boolean
  primary: boolean
}

export interface MappedTableSchema {
  schema: string
  table: string
  columns: MappedColumn[]
}

interface OpenApiDefinition {
  properties?: Record<string, OpenApiProperty>
  required?: string[]
}

interface OpenApiProperty {
  type?: string
  format?: string
  description?: string
}

export function mapTableSchema(
  schema: string,
  table: string,
  definition: OpenApiDefinition | undefined
): MappedTableSchema {
  const required = new Set(definition?.required ?? [])
  const properties = definition?.properties ?? {}

  const columns: MappedColumn[] = Object.entries(properties).map(([name, meta]) => {
    const description = meta?.description ?? ''
    const primary = /Primary Key/i.test(description)
    return {
      name,
      type: meta?.type ?? 'unknown',
      ...(meta?.format ? { format: meta.format } : {}),
      nullable: !required.has(name),
      primary,
    }
  })

  return { schema, table, columns }
}
