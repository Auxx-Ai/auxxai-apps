// tests/fedex-auth.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConnectionExpiredError,
  __peek,
  __resetSettings,
  __resetStorage,
  __setConnection,
} from '@auxx/sdk/server'
import {
  getFedexBaseUrl,
  getFedexToken,
  invalidateFedexToken,
  mintToken,
} from '../src/tools/shared/fedex-auth'

const okToken = (token = 'tok-1', expiresIn = 3600) => ({
  ok: true,
  status: 200,
  headers: { get: () => null },
  json: async () => ({ access_token: token, token_type: 'bearer', expires_in: expiresIn }),
})

beforeEach(() => {
  __resetStorage()
  __resetSettings()
  __setConnection({
    id: 'conn-1',
    type: 'secret',
    value: '',
    fields: { client_id: 'cid', client_secret: 'csec', account_number: '123456789' },
  })
  vi.restoreAllMocks()
})

describe('getFedexBaseUrl', () => {
  it('defaults to production', async () => {
    expect(await getFedexBaseUrl()).toBe('https://apis.fedex.com')
  })

  it('switches to sandbox when useTestEnvironment is on', async () => {
    const { __setSetting } = await import('@auxx/sdk/server')
    __setSetting('useTestEnvironment', true)
    expect(await getFedexBaseUrl()).toBe('https://apis-sandbox.fedex.com')
  })
})

describe('getFedexToken', () => {
  it('mints on a cache miss and caches with expiresIn - 300 TTL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okToken('tok-1', 3600))
    global.fetch = fetchMock as never

    const token = await getFedexToken()
    expect(token).toBe('tok-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const row = __peek('connection', '', 'bearer-token')
    expect(row?.value).toEqual({ token: 'tok-1' })
    // TTL ≈ 3600 - 300 = 3300s in the future.
    const ttlMs = (row?.expiresAt ?? 0) - Date.now()
    expect(ttlMs).toBeGreaterThan(3200_000)
    expect(ttlMs).toBeLessThanOrEqual(3300_000)
  })

  it('returns the cached token without minting again', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okToken('tok-1'))
    global.fetch = fetchMock as never

    await getFedexToken()
    const second = await getFedexToken()
    expect(second).toBe('tok-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('re-mints after invalidate', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okToken('tok-1'))
      .mockResolvedValueOnce(okToken('tok-2'))
    global.fetch = fetchMock as never

    expect(await getFedexToken()).toBe('tok-1')
    await invalidateFedexToken()
    expect(await getFedexToken()).toBe('tok-2')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('mintToken auth failures', () => {
  it('maps a 401 to ConnectionExpiredError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => null },
      json: async () => ({ errors: [{ code: 'NOT.AUTHORIZED.ERROR' }] }),
    }) as never
    await expect(mintToken()).rejects.toBeInstanceOf(ConnectionExpiredError)
  })

  it('maps a FedEx NOT.AUTHORIZED.ERROR envelope to ConnectionExpiredError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => null },
      json: async () => ({ errors: [{ code: 'NOT.AUTHORIZED.ERROR', message: 'bad keys' }] }),
    }) as never
    await expect(mintToken()).rejects.toBeInstanceOf(ConnectionExpiredError)
  })
})
