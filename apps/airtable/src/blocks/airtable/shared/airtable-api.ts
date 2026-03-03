// src/blocks/airtable/shared/airtable-api.ts

/**
 * Shared Airtable REST API utility used by execute functions and
 * dynamic list loaders (bases, tables, fields, views).
 */

export const AIRTABLE_API = 'https://api.airtable.com/v0'
const MAX_PAGES = 50
const PAGE_DELAY_MS = 250

/** Map Airtable error codes to human-readable messages. */
export const AIRTABLE_ERROR_MESSAGES: Record<string, string> = {
  AUTHENTICATION_REQUIRED: 'Airtable authentication failed. Please reconnect your account.',
  NOT_AUTHORIZED: 'You do not have permission to access this base or table.',
  NOT_FOUND: 'The specified base, table, or record was not found.',
  INVALID_REQUEST_UNKNOWN: 'Invalid request. Please check your inputs.',
  INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND: 'Base or table not found, or insufficient permissions.',
  MODEL_ID_NOT_FOUND: 'The specified record ID was not found.',
  CANNOT_UPDATE_COMPUTED_FIELD: 'Cannot write to a computed field (formula, rollup, lookup, etc.).',
  INVALID_VALUE_FOR_COLUMN:
    'The value provided is not valid for this field type. Try enabling Typecast.',
  UNKNOWN_FIELD_NAME: 'One or more field names do not exist in this table.',
}

/**
 * Throw a structured CONNECTION_NOT_FOUND error that the platform maps to
 * a "Connection Required" toast with a link to Settings → Apps.
 */
export function throwConnectionNotFound(): never {
  const err = new Error(
    'Airtable not connected. Please reconnect in Settings → Apps → Airtable.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/**
 * Call the Airtable REST API.
 */
export async function airtableApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  token: string,
  options: {
    body?: Record<string, unknown>
    qs?: Record<string, string>
  } = {}
): Promise<any> {
  const url = new URL(`${AIRTABLE_API}${endpoint}`)
  if (options.qs) {
    for (const [key, value] of Object.entries(options.qs)) {
      if (value) url.searchParams.set(key, value)
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
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
    let errorMessage = `Airtable API error: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      const errorType = errorBody?.error?.type
      if (errorType && AIRTABLE_ERROR_MESSAGES[errorType]) {
        errorMessage = AIRTABLE_ERROR_MESSAGES[errorType]
      } else if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message
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
 * Paginated GET for Airtable endpoints that return offset-based pages.
 * Stays under Airtable's 5 req/sec rate limit with a 250ms inter-page delay.
 */
export async function airtablePaginatedGet(
  endpoint: string,
  token: string,
  params: Record<string, string>,
  options: { returnAll: boolean; limit?: number }
): Promise<{ records: any[]; truncated: boolean }> {
  const records: any[] = []
  let offset: string | undefined
  let pages = 0

  do {
    if (pages > 0) await sleep(PAGE_DELAY_MS)

    const qs = { ...params, pageSize: '100', ...(offset ? { offset } : {}) }
    const response = await airtableApi('GET', endpoint, token, { qs })
    records.push(...(response.records ?? []))
    offset = response.offset
    pages++

    if (pages >= MAX_PAGES) break
    if (!options.returnAll && records.length >= (options.limit ?? 100)) break
  } while (offset)

  const truncated = !!offset
  const limited = options.returnAll ? records : records.slice(0, options.limit ?? 100)
  return { records: limited, truncated }
}

/**
 * Convert key-value array to Airtable fields object.
 * Used by create, update, and upsert operations.
 */
export function toAirtableFields(
  kvPairs: Array<{ fieldName: string; fieldValue: string }>
): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const { fieldName, fieldValue } of kvPairs) {
    if (fieldName && fieldValue !== undefined) {
      fields[fieldName] = fieldValue
    }
  }
  return fields
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
