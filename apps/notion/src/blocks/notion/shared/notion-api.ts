// src/blocks/notion/shared/notion-api.ts

/**
 * Shared Notion REST API utility used by execute functions and
 * dynamic list loaders (databases, properties, users, pages).
 */

export const NOTION_API = 'https://api.notion.com/v1'
export const NOTION_VERSION = '2022-06-28'
const MAX_PAGES = 50
const PAGE_DELAY_MS = 350

/** Map Notion HTTP status codes to user-friendly messages. */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your inputs.',
  401: 'Invalid API token. Please reconnect your Notion integration in Settings → Apps → Notion.',
  403: 'The integration does not have access to this resource. Share the page/database with your integration in Notion.',
  404: 'The specified page, database, or block was not found.',
  409: 'Conflict — the resource was modified by another request.',
  429: 'Rate limit exceeded. Please try again later.',
  502: 'Notion API is temporarily unavailable. Please try again.',
}

/**
 * Throw a structured CONNECTION_NOT_FOUND error that the platform maps to
 * a "Connection Required" toast with a link to Settings → Apps.
 */
export function throwConnectionNotFound(): never {
  const err = new Error(
    'Notion not connected. Please add your integration token in Settings → Apps → Notion.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/**
 * Call the Notion REST API.
 */
export async function notionApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  token: string,
  options: {
    body?: Record<string, unknown>
    query?: Record<string, string>
  } = {}
): Promise<any> {
  const url = new URL(`${NOTION_API}${endpoint}`)
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value) url.searchParams.set(key, value)
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
  }
  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!response.ok) {
    let errorMessage = `Notion API error: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      if (ERROR_MESSAGES[response.status]) {
        errorMessage = ERROR_MESSAGES[response.status]
      } else if (errorBody?.message) {
        errorMessage = errorBody.message
      }
    } catch {
      // Use default message
    }
    throw new Error(errorMessage)
  }

  if (response.status === 204) return {}
  return response.json()
}

/**
 * Paginated request for Notion endpoints.
 * Stays under Notion's 3 req/sec rate limit with a 350ms inter-page delay.
 *
 * GET endpoints pass start_cursor as query param.
 * POST endpoints pass start_cursor in the request body.
 */
export async function notionPaginatedRequest<T = any>(
  method: 'GET' | 'POST',
  path: string,
  token: string,
  options: {
    body?: Record<string, unknown>
    query?: Record<string, string>
    returnAll: boolean
    limit?: number
  }
): Promise<{ results: T[]; truncated: boolean }> {
  const results: T[] = []
  let cursor: string | undefined
  let pages = 0

  do {
    if (pages > 0) await sleep(PAGE_DELAY_MS)

    let response: any

    if (method === 'POST') {
      const body: Record<string, unknown> = {
        ...options.body,
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      }
      response = await notionApi('POST', path, token, { body })
    } else {
      const query: Record<string, string> = {
        ...options.query,
        page_size: '100',
        ...(cursor ? { start_cursor: cursor } : {}),
      }
      response = await notionApi('GET', path, token, { query })
    }

    results.push(...(response.results ?? []))
    cursor = response.has_more ? response.next_cursor : undefined
    pages++

    if (pages >= MAX_PAGES) break
    if (!options.returnAll && results.length >= (options.limit ?? 100)) break
  } while (cursor)

  const truncated = !!cursor
  const limited = options.returnAll ? results : results.slice(0, options.limit ?? 100)
  return { results: limited, truncated }
}

/** Writable property types that can be set via the Notion API. */
export const WRITABLE_PROPERTY_TYPES = new Set([
  'title',
  'rich_text',
  'number',
  'select',
  'multi_select',
  'status',
  'date',
  'people',
  'files',
  'checkbox',
  'url',
  'email',
  'phone_number',
  'relation',
])

/**
 * Convert a string value to the appropriate Notion property format
 * based on the property type.
 */
function formatPropertyValue(propType: string | undefined, value: string): any {
  switch (propType) {
    case 'title':
      return { title: [{ text: { content: value } }] }
    case 'rich_text':
      return { rich_text: [{ text: { content: value } }] }
    case 'number':
      return { number: parseFloat(value) }
    case 'select':
      return { select: { name: value } }
    case 'multi_select':
      return {
        multi_select: value
          .split(',')
          .map((v) => ({ name: v.trim() }))
          .filter((v) => v.name),
      }
    case 'status':
      return { status: { name: value } }
    case 'date':
      return { date: { start: value } }
    case 'checkbox':
      return { checkbox: value === 'true' }
    case 'url':
      return { url: value }
    case 'email':
      return { email: value }
    case 'phone_number':
      return { phone_number: value }
    case 'people':
      return {
        people: value
          .split(',')
          .map((id) => ({ id: id.trim() }))
          .filter((v) => v.id),
      }
    case 'relation':
      return {
        relation: value
          .split(',')
          .map((id) => ({ id: id.trim() }))
          .filter((v) => v.id),
      }
    case 'files':
      return { files: [{ type: 'external', name: 'File', external: { url: value } }] }
    default:
      // Default to rich_text for unknown types
      return { rich_text: [{ text: { content: value } }] }
  }
}

/**
 * Convert key-value pairs to Notion property format using the database schema.
 */
export function toNotionProperties(
  kvPairs: Array<{ propertyName: string; propertyValue: string }>,
  schema: Record<string, { type: string }>
): Record<string, any> {
  const properties: Record<string, any> = {}
  for (const { propertyName, propertyValue } of kvPairs) {
    if (!propertyName || propertyValue === undefined) continue
    const propType = schema[propertyName]?.type
    properties[propertyName] = formatPropertyValue(propType, propertyValue)
  }
  return properties
}

/**
 * Convert plain text content to a Notion paragraph block.
 */
export function textToParagraphBlock(content: string): any {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content } }],
    },
  }
}

/**
 * Build a simple Notion filter object from a property name, condition, value, and type.
 */
export function buildSimpleFilter(
  propertyName: string,
  condition: string,
  value: string,
  propertyType: string
): Record<string, any> {
  const filterType = getFilterType(propertyType)
  const filterValue = getFilterValue(condition, value, propertyType)

  return {
    property: propertyName,
    [filterType]: {
      [condition]: filterValue,
    },
  }
}

/** Map property type to the Notion filter type key. */
function getFilterType(propertyType: string): string {
  switch (propertyType) {
    case 'title':
    case 'rich_text':
    case 'url':
    case 'email':
    case 'phone_number':
      return propertyType === 'title'
        ? 'title'
        : propertyType === 'rich_text'
          ? 'rich_text'
          : propertyType
    case 'number':
      return 'number'
    case 'checkbox':
      return 'checkbox'
    case 'select':
      return 'select'
    case 'status':
      return 'status'
    case 'multi_select':
      return 'multi_select'
    case 'date':
    case 'created_time':
    case 'last_edited_time':
      return 'date'
    case 'people':
    case 'created_by':
    case 'last_edited_by':
      return 'people'
    case 'relation':
      return 'relation'
    case 'files':
      return 'files'
    default:
      return 'rich_text'
  }
}

/** Get the appropriate filter value based on condition and type. */
function getFilterValue(condition: string, value: string, propertyType: string): any {
  if (condition === 'is_empty' || condition === 'is_not_empty') return true
  if (propertyType === 'checkbox') return value === 'true'
  if (propertyType === 'number') return parseFloat(value)
  return value
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
