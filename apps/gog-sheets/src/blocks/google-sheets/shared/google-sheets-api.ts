// src/blocks/google-sheets/shared/google-sheets-api.ts

import {
  ConflictError,
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'

const SHEETS_BASE_URL = 'https://sheets.googleapis.com'
const DRIVE_BASE_URL = 'https://www.googleapis.com'

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Google Sheets not connected. Please reconnect in Settings \u2192 Apps \u2192 Google Sheets.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function sheetsApiRequest(
  accessToken: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  qs?: Record<string, string | number | boolean>,
  baseUrl: string = SHEETS_BASE_URL
) {
  const url = new URL(`${baseUrl}${path}`)
  if (qs) {
    for (const [k, v] of Object.entries(qs)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
  }

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    throw new UpstreamServiceError(
      err instanceof Error ? err.message : 'Google Sheets request failed'
    )
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message = (error as any)?.error?.message || `Google Sheets API error: ${response.status}`

    if (response.status === 401) throw new ConnectionExpiredError('organization')
    if (response.status === 403) throw new InsufficientPermissionsError('organization')
    if (response.status === 429) {
      const ra = Number(response.headers.get('Retry-After'))
      throw new RateLimitError(Number.isFinite(ra) ? ra : undefined)
    }
    if (response.status === 404) throw new NotFoundError(message)
    if (response.status === 409) throw new ConflictError(message)
    if (response.status >= 500) {
      throw new UpstreamServiceError(`Google Sheets error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) {
      throw new InvalidInputError(message)
    }

    throw new Error(message)
  }

  if (response.status === 204) return { success: true }
  return response.json()
}

export async function driveApiRequest(
  accessToken: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  qs?: Record<string, string | number | boolean>
) {
  return sheetsApiRequest(accessToken, method, path, body, qs, DRIVE_BASE_URL)
}
