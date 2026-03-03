// src/blocks/notion/shared/list-database-properties.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { notionApi, throwConnectionNotFound, WRITABLE_PROPERTY_TYPES } from './notion-api'

export interface DatabaseProperty {
  label: string
  value: string
  type: string
}

/**
 * Fetch properties for a database, optionally filtered to writable types only.
 * Returns property names as both label and value, with the type metadata.
 */
export default async function listDatabaseProperties(
  databaseId: string,
  { writableOnly = false }: { writableOnly?: boolean } = {},
): Promise<DatabaseProperty[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const response = await notionApi('GET', `/databases/${databaseId}`, connection.value)
  const properties = response.properties ?? {}

  const result: DatabaseProperty[] = []
  for (const [name, prop] of Object.entries(properties) as [string, any][]) {
    if (writableOnly && !WRITABLE_PROPERTY_TYPES.has(prop.type)) continue
    result.push({
      label: name,
      value: name,
      type: prop.type,
    })
  }

  return result.sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Fetch the full database schema (all properties with types).
 * Used by execute functions to determine property types for formatting.
 */
export async function getDatabaseSchema(
  token: string,
  databaseId: string,
): Promise<Record<string, { type: string }>> {
  const response = await notionApi('GET', `/databases/${databaseId}`, token)
  const properties = response.properties ?? {}

  const schema: Record<string, { type: string }> = {}
  for (const [name, prop] of Object.entries(properties) as [string, any][]) {
    schema[name] = { type: prop.type }
  }
  return schema
}
