// src/blocks/discord/shared/discord-api.ts

const DISCORD_API = 'https://discord.com/api/v10'

const ERROR_MESSAGES: Record<number, string> = {
  10003: 'Unknown Channel — the channel does not exist or bot cannot see it.',
  10004: 'Unknown Guild — the server does not exist or bot is not a member.',
  10008: 'Unknown Message — the message does not exist.',
  50001: 'Missing Access — bot lacks permission to access this resource.',
  50013: 'Missing Permissions — bot lacks the required permission for this action.',
  50035: 'Invalid Form Body — check your input values.',
}

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  401: 'Invalid Bot Token. Please check your token in Settings → Apps → Discord.',
  403: 'Bot does not have permission to perform this action. Check bot permissions in Discord server settings.',
  404: 'The specified resource was not found. Verify the guild, channel, or message ID.',
  429: 'Rate limit exceeded. Please try again later.',
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Discord bot not connected. Please add your Bot Token in Settings → Apps → Discord.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function discordApi<T = unknown>(
  endpoint: string,
  token: string,
  options: {
    method?: string
    body?: Record<string, unknown>
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options

  const headers: Record<string, string> = {
    Authorization: `Bot ${token}`,
  }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${DISCORD_API}${endpoint}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  // 204 No Content (e.g. reaction added, role added)
  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json()

  if (!response.ok) {
    const discordCode = (data as any)?.code as number | undefined
    const discordMessage = (data as any)?.message as string | undefined

    // Check Discord-specific error codes first
    if (discordCode && ERROR_MESSAGES[discordCode]) {
      throw new Error(ERROR_MESSAGES[discordCode])
    }

    // Check HTTP status codes
    if (HTTP_ERROR_MESSAGES[response.status]) {
      throw new Error(HTTP_ERROR_MESSAGES[response.status])
    }

    throw new Error(
      discordMessage ?? `Discord API error: ${response.status} ${response.statusText}`
    )
  }

  return data as T
}

const MAX_PAGES = 50
const PAGE_DELAY_MS = 50

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function discordPaginatedGet<T extends { id: string }>(
  endpoint: string,
  token: string,
  options: {
    returnAll: boolean
    limit?: number
    cursorParam: string // e.g., 'before' for messages, 'after' for members
    pageSize?: number
    qs?: Record<string, string>
  }
): Promise<{ items: T[]; truncated: boolean }> {
  const { returnAll, limit = 100, cursorParam, pageSize = 100, qs = {} } = options
  const items: T[] = []
  let cursor: string | undefined
  let pages = 0

  const targetCount = returnAll ? Number.POSITIVE_INFINITY : limit

  do {
    const params = new URLSearchParams({
      limit: String(Math.min(pageSize, targetCount - items.length)),
      ...qs,
      ...(cursor ? { [cursorParam]: cursor } : {}),
    })

    const page = await discordApi<T[]>(`${endpoint}?${params}`, token)
    if (!page.length) break

    items.push(...page)
    cursor = page[page.length - 1].id
    pages++

    if (items.length >= targetCount) break
    if (pages >= MAX_PAGES) break

    await sleep(PAGE_DELAY_MS)
  } while (true)

  const truncated = pages >= MAX_PAGES && items.length < targetCount
  return {
    items: items.slice(0, targetCount === Number.POSITIVE_INFINITY ? undefined : targetCount),
    truncated,
  }
}
