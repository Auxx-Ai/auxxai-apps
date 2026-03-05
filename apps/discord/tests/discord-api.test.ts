import { describe, it, expect, vi, beforeEach } from 'vitest'
import { discordApi, discordPaginatedGet, throwConnectionNotFound } from '../src/blocks/discord/shared/discord-api'

const TOKEN = 'fake-bot-token'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const defaultHeaders = new Headers({
  'x-ratelimit-remaining': '10',
  'x-ratelimit-reset-after': '0',
})

function jsonResponse(body: unknown, status = 200, statusText = 'OK', headers?: Headers) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: headers ?? defaultHeaders,
    json: async () => body,
  }
}

function noContentResponse() {
  return {
    ok: true,
    status: 204,
    statusText: 'No Content',
    headers: defaultHeaders,
    json: async () => ({}),
  }
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ── discordApi ──────────────────────────────────────────────────────────────

describe('discordApi', () => {
  it('sends correct headers and defaults to GET', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: '1' }))

    await discordApi('/channels/1', TOKEN)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/v10/channels/1',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: `Bot ${TOKEN}` },
      })
    )
  })

  it('serializes body as JSON and sets Content-Type', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: '1' }))

    await discordApi('/guilds/1/channels', TOKEN, {
      method: 'POST',
      body: { name: 'general', type: 0 },
    })

    const [, opts] = mockFetch.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(opts.headers['Content-Type']).toBe('application/json')
    expect(opts.body).toBe(JSON.stringify({ name: 'general', type: 0 }))
  })

  it('returns empty object for 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce(noContentResponse())

    const result = await discordApi('/channels/1/reactions', TOKEN, { method: 'PUT' })
    expect(result).toEqual({})
  })

  it('throws on 401 with token message', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ code: 0, message: 'Unauthorized' }, 401))

    await expect(discordApi('/channels/1', TOKEN)).rejects.toThrow(
      'Invalid Bot Token'
    )
  })

  it('throws on 403 with permission message', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ code: 50013, message: 'Missing Permissions' }, 403))

    await expect(discordApi('/channels/1', TOKEN)).rejects.toThrow(
      'Missing Permissions'
    )
  })

  it('throws on 404 with resource not found message', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ code: 0, message: 'Not Found' }, 404))

    await expect(discordApi('/channels/999', TOKEN)).rejects.toThrow(
      'The specified resource was not found'
    )
  })

  it('retries once on 429 then returns the result', async () => {
    // First call: 429 with retry_after
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ retry_after: 0.01 }, 429)
    )
    // Second call (retry): success
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: '1', name: 'ok' }))

    const result = await discordApi('/channels/1', TOKEN)

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ id: '1', name: 'ok' })
  })

  it('throws Discord error code message when known code is returned', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ code: 10003, message: 'Unknown Channel' }, 404))

    await expect(discordApi('/channels/999', TOKEN)).rejects.toThrow(
      'Unknown Channel'
    )
  })

  it('falls back to Discord message for unknown status/code', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ code: 99999, message: 'Something weird' }, 500, 'Internal Server Error'))

    await expect(discordApi('/test', TOKEN)).rejects.toThrow('Something weird')
  })

  it('falls back to status text when no Discord message', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 500, 'Internal Server Error'))

    await expect(discordApi('/test', TOKEN)).rejects.toThrow('Discord API error: 500 Internal Server Error')
  })

  it('sleeps when x-ratelimit-remaining is 0', async () => {
    const rateLimitHeaders = new Headers({
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset-after': '0.001',
    })
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: '1' }, 200, 'OK', rateLimitHeaders))

    const result = await discordApi('/channels/1', TOKEN)

    expect(result).toEqual({ id: '1' })
  })
})

// ── throwConnectionNotFound ──────────────────────────────────────────────────

describe('throwConnectionNotFound', () => {
  it('throws with CONNECTION_NOT_FOUND code', () => {
    expect(() => throwConnectionNotFound()).toThrowError('Discord bot not connected')

    try {
      throwConnectionNotFound()
    } catch (err: any) {
      expect(err.code).toBe('CONNECTION_NOT_FOUND')
      expect(err.scope).toBe('organization')
    }
  })
})

// ── discordPaginatedGet ─────────────────────────────────────────────────────

describe('discordPaginatedGet', () => {
  it('fetches a single page when items fit within limit', async () => {
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }]
    mockFetch.mockResolvedValueOnce(jsonResponse(items))
    // Second call returns empty to stop pagination
    mockFetch.mockResolvedValueOnce(jsonResponse([]))

    const result = await discordPaginatedGet('/guilds/1/members', TOKEN, {
      returnAll: true,
      cursorParam: 'after',
    })

    expect(result.items).toEqual(items)
    expect(result.truncated).toBe(false)
  })

  it('respects limit when returnAll is false', async () => {
    const page = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }))
    mockFetch.mockResolvedValueOnce(jsonResponse(page))

    const result = await discordPaginatedGet('/guilds/1/members', TOKEN, {
      returnAll: false,
      limit: 50,
      cursorParam: 'after',
      pageSize: 100,
    })

    expect(result.items).toHaveLength(50)
    expect(result.truncated).toBe(false)
  })

  it('passes cursor param from last item id', async () => {
    const page1 = [{ id: '10' }, { id: '20' }]
    const page2: any[] = []
    mockFetch.mockResolvedValueOnce(jsonResponse(page1))
    mockFetch.mockResolvedValueOnce(jsonResponse(page2))

    await discordPaginatedGet('/guilds/1/members', TOKEN, {
      returnAll: true,
      cursorParam: 'after',
      pageSize: 2,
    })

    // Second call should include after=20
    const secondUrl = mockFetch.mock.calls[1][0] as string
    expect(secondUrl).toContain('after=20')
  })

  it('passes additional qs params', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]))

    await discordPaginatedGet('/guilds/1/members', TOKEN, {
      returnAll: true,
      cursorParam: 'after',
      qs: { foo: 'bar' },
    })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('foo=bar')
  })
})
