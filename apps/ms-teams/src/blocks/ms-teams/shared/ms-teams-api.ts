// src/blocks/ms-teams/shared/ms-teams-api.ts

export const GRAPH_API = 'https://graph.microsoft.com'

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your inputs.',
  401: 'Microsoft Teams authentication failed. Please reconnect your account.',
  403: 'Insufficient permissions. Your account may need admin consent for this operation.',
  404: 'The specified resource was not found (team, channel, chat, or task).',
  409: 'Conflict — the resource was modified by another process. Please try again.',
  412: 'Precondition failed — the resource was modified. Please try again.',
  429: 'Rate limit exceeded. Microsoft Graph limits vary by endpoint. Please try again later.',
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Microsoft Teams not connected. Please connect your Microsoft account in Settings → Apps → Microsoft Teams.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function graphApi<T = unknown>(
  method: string,
  urlOrPath: string,
  token: string,
  options?: {
    body?: Record<string, unknown>
    headers?: Record<string, string>
    version?: 'v1.0' | 'beta'
  }
): Promise<T> {
  const { body, headers = {}, version = 'v1.0' } = options ?? {}

  // Support both full URLs (for pagination @odata.nextLink) and relative paths
  const url = urlOrPath.startsWith('http') ? urlOrPath : `${GRAPH_API}/${version}${urlOrPath}`

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  if (!response.ok) {
    const message =
      ERROR_MESSAGES[response.status] ??
      `Microsoft Graph API error: ${response.status} ${response.statusText}`
    throw new Error(message)
  }

  // DELETE returns 204 No Content
  if (response.status === 204) return {} as T

  return response.json() as Promise<T>
}

const MAX_PAGES = 50

export async function graphPaginatedGet<T>(
  endpoint: string,
  token: string,
  options: { returnAll: boolean; limit?: number; version?: 'v1.0' | 'beta' }
): Promise<{ items: T[]; totalCount: number }> {
  const { returnAll, limit = 100, version = 'v1.0' } = options
  const items: T[] = []
  let url: string | null = `${GRAPH_API}/${version}${endpoint}`
  let pages = 0

  do {
    const response: { value: T[]; '@odata.nextLink'?: string } = await graphApi('GET', url!, token)
    items.push(...(response.value ?? []))
    url = response['@odata.nextLink'] ?? null
    pages++

    if (pages >= MAX_PAGES) break
    if (!returnAll && items.length >= limit) break
  } while (url)

  const limited = returnAll ? items : items.slice(0, limit)
  return { items: limited, totalCount: limited.length }
}
