// tests/ups-api.test.ts

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
import { trackNumbers, trackNumbersSettled } from '../src/tools/shared/ups-api'

const res = (body: unknown, status = 200, headers: Record<string, string> = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'x',
  headers: { get: (k: string) => headers[k] ?? null },
  json: async () => body,
})

const pkgEnvelope = (pkg: Record<string, unknown>) => ({
  trackResponse: { shipment: [{ package: [pkg] }] },
})

beforeEach(() => {
  __resetStorage()
  __resetSettings()
  __setConnection({ id: 'conn-1', type: 'oauth2-code', value: 'tok', fields: {} })
  vi.restoreAllMocks()
})

describe('trackNumbers request', () => {
  it('sends bearer + transId + transactionSrc headers and parses the package', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(pkgEnvelope({ currentStatus: { type: 'I', code: 'OR' } })))
    global.fetch = fetchMock as never

    const results = await trackNumbers(['1Z111'])
    expect(results).toEqual([
      { trackingNumber: '1Z111', found: true, pkg: { currentStatus: { type: 'I', code: 'OR' } } },
    ])

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('https://onlinetools.ups.com/api/track/v1/details/1Z111')
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.headers.transactionSrc).toBe('auxx')
    expect(init.headers.transId).toHaveLength(32)
  })

  it('routes to the CIE host when useTestEnvironment is on', async () => {
    __setSetting('useTestEnvironment', true)
    global.fetch = vi.fn().mockResolvedValue(res(pkgEnvelope({ currentStatus: { type: 'I' } }))) as never

    await trackNumbers(['1Z111'])
    expect((global.fetch as never as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain(
      'https://wwwcie.ups.com/api/track/v1/details/1Z111'
    )
  })

  it('adds returnSignature / returnPOD query params only when requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(pkgEnvelope({ currentStatus: { type: 'D' } })))
    global.fetch = fetchMock as never

    await trackNumbers(['1Z111'], { returnSignature: true, returnPod: true })
    const url: string = fetchMock.mock.calls[0][0]
    expect(url).toContain('returnSignature=true')
    expect(url).toContain('returnPOD=true')
  })

  it('preserves input order when fanning out', async () => {
    global.fetch = vi.fn(async (url: string) => {
      const n = url.split('/details/')[1].split('?')[0]
      return res(pkgEnvelope({ currentStatus: { type: 'I', code: n } }))
    }) as never

    const results = await trackNumbers(['A', 'B', 'C'])
    expect(results.map((r) => r.trackingNumber)).toEqual(['A', 'B', 'C'])
    expect(results.map((r) => (r.pkg as { currentStatus: { code: string } }).currentStatus.code)).toEqual([
      'A',
      'B',
      'C',
    ])
  })
})

describe('not found is not an exception', () => {
  it('returns found:false on a 404', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(res({ response: { errors: [{ code: '151044', message: 'no info' }] } }, 404)) as never

    const results = await trackNumbers(['1Z111'])
    expect(results).toEqual([{ trackingNumber: '1Z111', found: false, pkg: null }])
  })

  it('returns found:false on a 200 with no package', async () => {
    global.fetch = vi.fn().mockResolvedValue(res({ trackResponse: { shipment: [] } })) as never
    const results = await trackNumbers(['1Z111'])
    expect(results).toEqual([{ trackingNumber: '1Z111', found: false, pkg: null }])
  })
})

describe('error mapping', () => {
  async function expectMappedError(
    status: number,
    body: unknown,
    headers: Record<string, string>,
    ctor: unknown
  ) {
    global.fetch = vi.fn().mockResolvedValue(res(body, status, headers)) as never
    await expect(trackNumbers(['1Z111'])).rejects.toBeInstanceOf(ctor as never)
  }

  it('401 → ConnectionExpiredError', () => expectMappedError(401, {}, {}, ConnectionExpiredError))
  it('403 → InsufficientPermissionsError', () =>
    expectMappedError(403, {}, {}, InsufficientPermissionsError))
  it('429 → RateLimitError', () => expectMappedError(429, {}, {}, RateLimitError))
  it('500 → UpstreamServiceError', () => expectMappedError(500, {}, {}, UpstreamServiceError))
  it('400 → InvalidInputError', () =>
    expectMappedError(400, { response: { errors: [{ message: 'bad' }] } }, {}, InvalidInputError))
  it('422 → InvalidInputError', () => expectMappedError(422, {}, {}, InvalidInputError))

  it('maps a 10429 error code to RateLimitError even on a 200', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(res({ response: { errors: [{ code: '10429', message: 'quota' }] } })) as never
    await expect(trackNumbers(['1Z111'])).rejects.toBeInstanceOf(RateLimitError)
  })

  it('throws on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET')) as never
    await expect(trackNumbers(['1Z111'])).rejects.toBeInstanceOf(UpstreamServiceError)
  })
})

describe('trackNumbersSettled', () => {
  it('marks a throwing number as error and keeps the rest', async () => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.includes('/BAD')) return res({}, 500)
      return res(pkgEnvelope({ currentStatus: { type: 'I' } }))
    }) as never

    const results = await trackNumbersSettled(['OK', 'BAD'])
    expect(results.find((r) => r.trackingNumber === 'OK')).toMatchObject({ error: false, found: true })
    expect(results.find((r) => r.trackingNumber === 'BAD')).toMatchObject({
      error: true,
      found: false,
      pkg: null,
    })
  })
})
