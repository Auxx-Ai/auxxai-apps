// tests/fedex-api.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  RateLimitError,
  UpstreamServiceError,
  __resetSettings,
  __resetStorage,
  __setConnection,
  __setSetting,
} from '@auxx/sdk/server'
import { trackByNumbers } from '../src/tools/shared/fedex-api'

const tokenResponse = () => ({
  ok: true,
  status: 200,
  headers: { get: () => null },
  json: async () => ({ access_token: 'tok', expires_in: 3600 }),
})

const trackResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'x',
  headers: { get: (k: string) => headers[k] ?? null },
  json: async () => body,
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

describe('trackByNumbers request', () => {
  it('sends bearer + transaction-id headers and parses completeTrackResults', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        trackResponse({
          output: {
            completeTrackResults: [
              { trackingNumber: '111', trackResults: [{ latestStatusDetail: { code: 'IT' } }] },
            ],
          },
        })
      )
    global.fetch = fetchMock as never

    const results = await trackByNumbers([{ trackingNumberInfo: { trackingNumber: '111' } }])
    expect(results).toEqual([
      { trackingNumber: '111', trackResults: [{ latestStatusDetail: { code: 'IT' } }] },
    ])

    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('https://apis.fedex.com/track/v1/trackingnumbers')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.headers['x-customer-transaction-id']).toBeTruthy()
  })

  it('routes to the sandbox host when useTestEnvironment is on', async () => {
    __setSetting('useTestEnvironment', true)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(trackResponse({ output: { completeTrackResults: [] } }))
    global.fetch = fetchMock as never

    await trackByNumbers([{ trackingNumberInfo: { trackingNumber: '111' } }])
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://apis-sandbox.fedex.com/track/v1/trackingnumbers'
    )
  })
})

describe('401 retry-once', () => {
  it('invalidates, re-mints, and retries once on a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse()) // initial mint
      .mockResolvedValueOnce(trackResponse({}, 401)) // first track → 401
      .mockResolvedValueOnce(tokenResponse()) // re-mint
      .mockResolvedValueOnce(trackResponse({ output: { completeTrackResults: [] } })) // retry ok
    global.fetch = fetchMock as never

    const results = await trackByNumbers([{ trackingNumberInfo: { trackingNumber: '111' } }])
    expect(results).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('throws ConnectionExpiredError on a second 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(trackResponse({}, 401))
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(trackResponse({}, 401))
    global.fetch = fetchMock as never

    await expect(
      trackByNumbers([{ trackingNumberInfo: { trackingNumber: '111' } }])
    ).rejects.toBeInstanceOf(ConnectionExpiredError)
  })
})

describe('error mapping', () => {
  async function expectMappedError(status: number, headers: Record<string, string>, ctor: unknown) {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(trackResponse({ errors: [{ message: 'boom' }] }, status, headers))
    global.fetch = fetchMock as never
    await expect(
      trackByNumbers([{ trackingNumberInfo: { trackingNumber: '111' } }])
    ).rejects.toBeInstanceOf(ctor as never)
  }

  it('403 → InsufficientPermissionsError', () =>
    expectMappedError(403, {}, InsufficientPermissionsError))
  it('429 → RateLimitError', () => expectMappedError(429, { 'Retry-After': '30' }, RateLimitError))
  it('500 → UpstreamServiceError', () => expectMappedError(500, {}, UpstreamServiceError))
  it('400 → InvalidInputError', () => expectMappedError(400, {}, InvalidInputError))
  it('422 → InvalidInputError', () => expectMappedError(422, {}, InvalidInputError))
})
