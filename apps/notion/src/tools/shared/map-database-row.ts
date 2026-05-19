// src/tools/shared/map-database-row.ts

import { extractPageTitle } from './map-page'

/**
 * Map a Notion page that lives as a row inside a database to a flat property
 * array the LLM can read. Multi-value types are comma-joined; everything is
 * serialized to a string so the output shape stays uniform per database.
 *
 * See plans/kopilot/apps/notion-overhaul.md §4.8.
 */

export interface MappedDatabaseRowProperty {
  name: string
  type: string
  value: string
}

export interface MappedDatabaseRow {
  pageId: string
  url: string
  title: string
  properties: MappedDatabaseRowProperty[]
  createdTime: string
  lastEditedTime: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringifyPropertyValue(prop: any): string {
  if (!prop) return ''
  const type = prop.type
  const value = prop[type]

  switch (type) {
    case 'title':
    case 'rich_text':
      return Array.isArray(value) ? value.map((t: any) => t.plain_text ?? '').join('') : ''
    case 'number':
      return value === null || value === undefined ? '' : String(value)
    case 'select':
    case 'status':
      return value?.name ?? ''
    case 'multi_select':
      return Array.isArray(value) ? value.map((o: any) => o.name).join(', ') : ''
    case 'date':
      if (!value) return ''
      return value.end ? `${value.start} → ${value.end}` : (value.start ?? '')
    case 'checkbox':
      return value ? 'true' : 'false'
    case 'url':
    case 'email':
    case 'phone_number':
      return value ?? ''
    case 'people':
      return Array.isArray(value)
        ? value
            .map((p: any) => p.name ?? p.id ?? '')
            .filter(Boolean)
            .join(', ')
        : ''
    case 'relation':
      return Array.isArray(value) ? value.map((r: any) => r.id).join(', ') : ''
    case 'files':
      return Array.isArray(value)
        ? value
            .map((f: any) => f.external?.url ?? f.file?.url ?? f.name ?? '')
            .filter(Boolean)
            .join(', ')
        : ''
    case 'formula': {
      const inner = value
      if (!inner) return ''
      switch (inner.type) {
        case 'string':
          return inner.string ?? ''
        case 'number':
          return inner.number === null || inner.number === undefined ? '' : String(inner.number)
        case 'boolean':
          return inner.boolean ? 'true' : 'false'
        case 'date':
          return inner.date?.start ?? ''
        default:
          return ''
      }
    }
    case 'rollup': {
      const inner = value
      if (!inner) return ''
      if (inner.type === 'array' && Array.isArray(inner.array)) {
        return inner.array.map((entry: any) => stringifyPropertyValue(entry)).join(', ')
      }
      if (inner.type === 'number')
        return inner.number === null || inner.number === undefined ? '' : String(inner.number)
      if (inner.type === 'date') return inner.date?.start ?? ''
      return ''
    }
    case 'created_time':
    case 'last_edited_time':
      return value ?? ''
    case 'created_by':
    case 'last_edited_by':
      return value?.name ?? value?.id ?? ''
    case 'unique_id':
      return value?.prefix ? `${value.prefix}-${value.number}` : String(value?.number ?? '')
    case 'verification':
      return value?.state ?? ''
    default:
      return ''
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseRow(page: any): MappedDatabaseRow {
  const props = page?.properties ?? {}
  const properties: MappedDatabaseRowProperty[] = []

  for (const [name, prop] of Object.entries(props) as [string, any][]) {
    properties.push({
      name,
      type: prop?.type ?? 'unknown',
      value: stringifyPropertyValue(prop),
    })
  }

  return {
    pageId: page?.id ?? '',
    url: page?.url ?? '',
    title: extractPageTitle(page),
    properties,
    createdTime: page?.created_time ?? '',
    lastEditedTime: page?.last_edited_time ?? '',
  }
}
