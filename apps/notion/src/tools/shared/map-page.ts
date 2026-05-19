// src/tools/shared/map-page.ts

/**
 * Tool-surface mapper for a Notion page. Returns structured fields the LLM can
 * consume directly. Returns `properties` as stringified JSON to keep the token
 * budget reasonable on generic page reads — structured access is via
 * query_notion_database (where the LLM also has the schema).
 *
 * See plans/kopilot/apps/notion-overhaul.md §4.3, §7.
 */

export interface MappedNotionPage {
  pageId: string
  title: string
  url: string
  icon: string | null
  cover: string | null
  parentType: 'workspace' | 'page' | 'database' | 'block'
  parentId: string | null
  databaseId: string | null
  properties: string
  createdTime: string
  lastEditedTime: string
  archived: boolean
}

export interface MappedNotionPageSummary {
  pageId: string
  title: string
  url: string
  parentType: 'workspace' | 'page' | 'database' | 'block'
  parentId: string | null
  createdTime: string
  lastEditedTime: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveParent(parent: any): {
  parentType: 'workspace' | 'page' | 'database' | 'block'
  parentId: string | null
  databaseId: string | null
} {
  if (!parent) {
    return { parentType: 'workspace', parentId: null, databaseId: null }
  }
  switch (parent.type) {
    case 'database_id':
      return {
        parentType: 'database',
        parentId: parent.database_id ?? null,
        databaseId: parent.database_id ?? null,
      }
    case 'page_id':
      return { parentType: 'page', parentId: parent.page_id ?? null, databaseId: null }
    case 'block_id':
      return { parentType: 'block', parentId: parent.block_id ?? null, databaseId: null }
    case 'workspace':
    default:
      return { parentType: 'workspace', parentId: null, databaseId: null }
  }
}

/**
 * Extract a human-readable title from a Notion page. Looks at the title
 * property (databaseRows) and falls back to the page title array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractPageTitle(page: any): string {
  const props = page?.properties ?? {}
  for (const value of Object.values(props) as any[]) {
    if (value?.type === 'title' && Array.isArray(value.title)) {
      const text = value.title.map((t: any) => t.plain_text ?? '').join('')
      if (text) return text
    }
  }
  if (Array.isArray(page?.title)) {
    return page.title.map((t: any) => t.plain_text ?? '').join('')
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
function resolveCover(cover: any): string | null {
  if (!cover) return null
  if (cover.type === 'external') return cover.external?.url ?? null
  if (cover.type === 'file') return cover.file?.url ?? null
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPage(page: any): MappedNotionPage {
  const { parentType, parentId, databaseId } = resolveParent(page?.parent)
  return {
    pageId: page?.id ?? '',
    title: extractPageTitle(page),
    url: page?.url ?? '',
    icon: resolveIcon(page?.icon),
    cover: resolveCover(page?.cover),
    parentType,
    parentId,
    databaseId,
    properties: JSON.stringify(page?.properties ?? {}),
    createdTime: page?.created_time ?? '',
    lastEditedTime: page?.last_edited_time ?? '',
    archived: Boolean(page?.archived),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPageSummary(page: any): MappedNotionPageSummary {
  const { parentType, parentId } = resolveParent(page?.parent)
  return {
    pageId: page?.id ?? '',
    title: extractPageTitle(page),
    url: page?.url ?? '',
    parentType,
    parentId,
    createdTime: page?.created_time ?? '',
    lastEditedTime: page?.last_edited_time ?? '',
  }
}
