// src/blocks/supabase/shared/supabase-api.ts

/**
 * Shared Supabase PostgREST API utility. Used by block execute handlers
 * AND by the chat-tool execute handlers (per the overhaul plan, §16).
 * Don't fork this into src/tools/ — keep the transport single-source.
 */

import { ConnectionExpiredError } from '@auxx/sdk/server'

const MAX_PAGES = 50
export const POSTGREST_PAGE_SIZE = 1000

/**
 * HTTP status → message. PostgREST also returns error codes in the body,
 * which we surface preferentially over the generic status mapping.
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  401: 'Invalid API key. Check your Service Role key in Settings → Apps → Supabase.',
  403: 'Insufficient permissions. Ensure you are using the Service Role key, not the anon key.',
  404: 'Table or resource not found. Check that the table exists and is accessible.',
  409: 'Conflict — a row with this value already exists (unique constraint violation).',
  422: 'Invalid request. Check that your field values match the column types.',
}

const POSTGREST_ERROR_MESSAGES: Record<string, string> = {
  PGRST116: 'No rows found matching the filter conditions.',
  PGRST204: 'Column not found in the table schema.',
  '23505': 'Unique constraint violation — a row with this value already exists.',
  '23503': 'Foreign key constraint violation — the referenced record does not exist.',
  '42P01': 'Table does not exist.',
  '42703': 'Column does not exist.',
}

/**
 * Throw a structured CONNECTION_NOT_FOUND error that the platform maps to
 * a "Connection Required" toast with a link to Settings → Apps.
 */
export function throwConnectionNotFound(): never {
  const err = new Error(
    'Supabase not connected. Please reconnect in Settings → Apps → Supabase.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/** Throw when the projectUrl org setting is missing. */
export function throwProjectUrlNotSet(): never {
  throw new Error(
    'Supabase Project URL not configured. Go to Settings → Apps → Supabase to set your project URL.'
  )
}

/**
 * Call the Supabase PostgREST API. Sends BOTH apikey and Authorization
 * headers with the same Service Role key value — Supabase's API gateway
 * requires apikey, PostgREST requires Authorization.
 */
export async function supabaseApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  serviceRoleKey: string,
  projectUrl: string,
  options: {
    body?: unknown
    qs?: Record<string, string>
    headers?: Record<string, string>
  } = {}
): Promise<any> {
  const base = projectUrl.replace(/\/$/, '')
  const url = new URL(`${base}/rest/v1${endpoint}`)
  if (options.qs) {
    for (const [key, value] of Object.entries(options.qs)) {
      if (value !== undefined && value !== '') url.searchParams.append(key, value)
    }
  }

  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...(options.headers ?? {}),
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    // Make write operations return the affected rows
    if (method !== 'GET' && !headers['Prefer']) {
      headers['Prefer'] = 'return=representation'
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ConnectionExpiredError('organization')
    }

    let errorMessage =
      HTTP_ERROR_MESSAGES[response.status] ??
      `Supabase API error: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      const code = errorBody?.code
      if (code && POSTGREST_ERROR_MESSAGES[code]) {
        errorMessage = POSTGREST_ERROR_MESSAGES[code]
      } else if (errorBody?.message) {
        errorMessage = errorBody.message
      } else if (errorBody?.hint) {
        errorMessage = `${errorMessage} (${errorBody.hint})`
      }
    } catch {
      // Use default message
    }
    throw new Error(errorMessage)
  }

  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Paginated GET for PostgREST endpoints. PostgREST defaults to 1000 rows
 * per page; we use limit/offset to walk the table. Capped at 50 pages
 * (50k rows) to prevent runaway queries.
 */
export async function supabasePaginatedGet(
  endpoint: string,
  serviceRoleKey: string,
  projectUrl: string,
  baseQs: Record<string, string>,
  options: { returnAll: boolean; limit?: number; headers?: Record<string, string> }
): Promise<{ rows: any[]; truncated: boolean }> {
  const rows: any[] = []
  let offset = 0
  let pages = 0
  const targetLimit = options.limit ?? 50

  while (true) {
    const qs: Record<string, string> = {
      ...baseQs,
      limit: String(POSTGREST_PAGE_SIZE),
      offset: String(offset),
    }
    const page = await supabaseApi('GET', endpoint, serviceRoleKey, projectUrl, {
      qs,
      headers: options.headers,
    })
    const pageRows = Array.isArray(page) ? page : []
    rows.push(...pageRows)
    pages++

    if (pageRows.length < POSTGREST_PAGE_SIZE) break
    if (pages >= MAX_PAGES) break
    if (!options.returnAll && rows.length >= targetLimit) break

    offset += pageRows.length
  }

  const truncated = pages >= MAX_PAGES
  const limited = options.returnAll ? rows : rows.slice(0, targetLimit)
  return { rows: limited, truncated }
}

/**
 * Convert key-value array to a column→value object for inserts/updates.
 * Used by row create and update operations.
 */
export function toSupabaseFields(
  kvPairs: Array<{ fieldName: string; fieldValue: string }>
): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const { fieldName, fieldValue } of kvPairs ?? []) {
    if (fieldName && fieldValue !== undefined) {
      fields[fieldName] = fieldValue
    }
  }
  return fields
}
