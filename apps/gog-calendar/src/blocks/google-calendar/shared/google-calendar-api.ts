// src/blocks/google-calendar/shared/google-calendar-api.ts

const BASE_URL = 'https://www.googleapis.com'

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Google Calendar not connected. Please reconnect in Settings → Apps → Google Calendar.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function gcalApiRequest(
  accessToken: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  qs?: Record<string, string | number | boolean>
) {
  const url = new URL(`${BASE_URL}${path}`)
  if (qs) {
    for (const [k, v] of Object.entries(qs)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as any)?.error?.message || `Google Calendar API error: ${response.status}`
    )
  }

  if (response.status === 204) return { success: true }
  return response.json()
}

export async function gcalApiRequestAll(
  accessToken: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  qs?: Record<string, string | number | boolean>
) {
  const items: any[] = []
  let pageToken: string | undefined

  do {
    const result = await gcalApiRequest(accessToken, method, path, body, {
      ...qs,
      ...(pageToken ? { pageToken } : {}),
    })
    if (result.items) items.push(...result.items)
    pageToken = result.nextPageToken
  } while (pageToken)

  return items
}
