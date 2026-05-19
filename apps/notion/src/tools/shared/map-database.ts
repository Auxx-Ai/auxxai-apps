// src/tools/shared/map-database.ts

import { WRITABLE_PROPERTY_TYPES } from '../../blocks/notion/shared/notion-api'

/**
 * Tool-surface mapper for a Notion database. Flattens the per-property config
 * to an array of `{ name, type, options, writable }` so the LLM can construct
 * typed-property writes without parsing nested provider unions.
 *
 * See plans/kopilot/apps/notion-overhaul.md §4.7, §10.
 */

export interface MappedNotionDatabaseProperty {
  name: string
  type: string
  options: string[] | null
  writable: boolean
}

export interface MappedNotionDatabase {
  databaseId: string
  title: string
  url: string
  properties: MappedNotionDatabaseProperty[]
}

export interface MappedNotionDatabaseSummary {
  databaseId: string
  title: string
  url: string
  icon: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTitle(db: any): string {
  if (Array.isArray(db?.title)) {
    return db.title.map((t: any) => t.plain_text ?? '').join('')
  }
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveIcon(icon: any): string | null {
  if (!icon) return null
  if (icon.type === 'emoji') return icon.emoji ?? null
  if (icon.type === 'external') return icon.external?.url ?? null
  if (icon.type === 'file') return icon.file?.url ?? null
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractOptions(prop: any): string[] | null {
  const config = prop?.[prop?.type]
  if (!config) return null
  if (Array.isArray(config.options)) {
    return config.options.map((o: any) => o.name).filter((n: unknown): n is string => Boolean(n))
  }
  if (config.groups || config.options) {
    // Status properties carry both groups[] and options[].
    if (Array.isArray(config.options)) {
      return config.options.map((o: any) => o.name).filter(Boolean)
    }
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabase(db: any): MappedNotionDatabase {
  const properties: MappedNotionDatabaseProperty[] = []
  const rawProps = db?.properties ?? {}

  for (const [name, prop] of Object.entries(rawProps) as [string, any][]) {
    properties.push({
      name,
      type: prop?.type ?? 'unknown',
      options: extractOptions(prop),
      writable: WRITABLE_PROPERTY_TYPES.has(prop?.type),
    })
  }

  return {
    databaseId: db?.id ?? '',
    title: extractTitle(db),
    url: db?.url ?? '',
    properties,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseSummary(db: any): MappedNotionDatabaseSummary {
  return {
    databaseId: db?.id ?? '',
    title: extractTitle(db),
    url: db?.url ?? '',
    icon: resolveIcon(db?.icon),
  }
}
