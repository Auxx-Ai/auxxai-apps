// tests/shipstation-api.test.ts

/**
 * The shared V2 client: method and body support, and every invariant the live
 * probe established that must survive writes being added.
 *
 * `fetch` is stubbed, never called, so the exact request the client builds is
 * the assertion: the raw `api-key` header (V2 rejects `Authorization: Bearer`),
 * `redirect: 'error'` so a provider-returned URL can never receive the
 * credential, an abort signal, and the status-to-SDK-error mapping.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'
import { shipstationApi } from '../src/tools/shared/shipstation-api'

const API_KEY = 'test-api-key'

const fetchMock = vi.fn()

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

/** The single request the stub received, as `[url, init]`. */
function lastCall(): [string, RequestInit] {
  expect(fetchMock).toHaveBeenCalledTimes(1)
  return fetchMock.mock.calls[0] as [string, RequestInit]
}

function headerOf(init: RequestInit, name: string): string | undefined {
  return (init.headers as Record<string, string>)[name]
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the positional GET form', () => {
  it('builds the path below /v2 and sends the query', async () => {
    fetchMock.mockResolvedValue(json({ labels: [] }))

    const result = await shipstationApi<{ labels: unknown[] }>('/labels', API_KEY, {
      page: 2,
      page_size: 50,
      label_status: 'completed',
      voided: false,
    })

    const [url, init] = lastCall()
    expect(url).toBe(
      'https://api.shipstation.com/v2/labels?page=2&page_size=50&label_status=completed&voided=false'
    )
    expect(init.method).toBe('GET')
    expect(init.body).toBeUndefined()
    expect(result).toEqual({ labels: [] })
  })

  it('drops undefined and empty query values rather than sending blanks', async () => {
    fetchMock.mockResolvedValue(json({ labels: [] }))

    await shipstationApi('/labels', API_KEY, {
      page: 1,
      created_at_start: undefined,
      batch_id: '',
    })

    expect(lastCall()[0]).toBe('https://api.shipstation.com/v2/labels?page=1')
  })

  it('works with no query at all', async () => {
    fetchMock.mockResolvedValue(json({ carriers: [] }))

    await shipstationApi('/carriers', API_KEY)

    expect(lastCall()[0]).toBe('https://api.shipstation.com/v2/carriers')
  })
})

describe('the request contract the probe proved', () => {
  it('authenticates with the raw api-key header, never a bearer token', async () => {
    fetchMock.mockResolvedValue(json({}))

    await shipstationApi({ endpoint: '/shipments', apiKey: API_KEY, method: 'POST', body: {} })

    const [, init] = lastCall()
    expect(headerOf(init, 'api-key')).toBe(API_KEY)
    expect(headerOf(init, 'Authorization')).toBeUndefined()
  })

  it('refuses redirects and times the request out, on a write as well as a read', async () => {
    fetchMock.mockResolvedValue(json({}))

    await shipstationApi({ endpoint: '/shipments', apiKey: API_KEY, method: 'POST', body: {} })

    const [, init] = lastCall()
    expect(init.redirect).toBe('error')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('writes', () => {
  it('POSTs a JSON body with a JSON content type', async () => {
    fetchMock.mockResolvedValue(json({ shipments: [{ shipment_id: 'se-1' }] }, 200))

    const body = { shipments: [{ service_code: 'usps_priority_mail' }] }
    const result = await shipstationApi<{ shipments: { shipment_id: string }[] }>({
      endpoint: '/shipments',
      apiKey: API_KEY,
      method: 'POST',
      body,
    })

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/shipments')
    expect(init.method).toBe('POST')
    expect(headerOf(init, 'Content-Type')).toBe('application/json')
    expect(init.body).toBe(JSON.stringify(body))
    expect(result.shipments[0].shipment_id).toBe('se-1')
  })

  it('POSTs an array body, which POST /v2/addresses/validate takes', async () => {
    fetchMock.mockResolvedValue(json([{ status: 'verified' }]))

    await shipstationApi({
      endpoint: '/addresses/validate',
      apiKey: API_KEY,
      method: 'POST',
      body: [{ address_line1: '1 Main St' }],
    })

    expect(lastCall()[1].body).toBe('[{"address_line1":"1 Main St"}]')
  })

  it('PUTs with a body', async () => {
    fetchMock.mockResolvedValue(json({ shipment_id: 'se-1' }))

    await shipstationApi({
      endpoint: '/shipments/se-1',
      apiKey: API_KEY,
      method: 'PUT',
      body: { service_code: 'ups_ground' },
    })

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/shipments/se-1')
    expect(init.method).toBe('PUT')
    expect(init.body).toBe('{"service_code":"ups_ground"}')
  })

  it('PUTs with no body and no content type, the shape of a void', async () => {
    fetchMock.mockResolvedValue(json({ approved: true, message: 'Label voided' }))

    const result = await shipstationApi<{ approved: boolean }>({
      endpoint: '/labels/se-1/void',
      apiKey: API_KEY,
      method: 'PUT',
    })

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/labels/se-1/void')
    expect(init.method).toBe('PUT')
    expect(init.body).toBeUndefined()
    expect(headerOf(init, 'Content-Type')).toBeUndefined()
    expect(result.approved).toBe(true)
  })

  it('DELETEs, and a query still applies to a write', async () => {
    fetchMock.mockResolvedValue(json({ tag_name: 'rush' }))

    await shipstationApi({
      endpoint: '/shipments/se-1/tags/rush',
      apiKey: API_KEY,
      method: 'DELETE',
      query: { store_id: 'st-1' },
    })

    const [url, init] = lastCall()
    expect(url).toBe('https://api.shipstation.com/v2/shipments/se-1/tags/rush?store_id=st-1')
    expect(init.method).toBe('DELETE')
    expect(init.body).toBeUndefined()
  })

  it('never sends a body on a GET, because fetch rejects one outright', async () => {
    fetchMock.mockResolvedValue(json({}))

    await shipstationApi({
      endpoint: '/labels',
      apiKey: API_KEY,
      method: 'GET',
      body: { nope: true },
    })

    const [, init] = lastCall()
    expect(init.body).toBeUndefined()
    expect(headerOf(init, 'Content-Type')).toBeUndefined()
  })
})

describe('empty success bodies', () => {
  it('resolves to undefined on a 204 rather than throwing on an empty parse', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(
      shipstationApi({ endpoint: '/shipments/se-1/tags/rush', apiKey: API_KEY, method: 'DELETE' })
    ).resolves.toBeUndefined()
  })

  it('resolves to undefined on a 200 with a zero-length body', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }))

    await expect(
      shipstationApi({ endpoint: '/labels/se-1/void', apiKey: API_KEY, method: 'PUT' })
    ).resolves.toBeUndefined()
  })

  it('reports a non-empty body that is not JSON as an upstream fault', async () => {
    fetchMock.mockResolvedValue(new Response('<html>502</html>', { status: 200 }))

    await expect(shipstationApi('/labels', API_KEY)).rejects.toBeInstanceOf(UpstreamServiceError)
  })
})

describe('error mapping', () => {
  it('maps 401 to ConnectionExpiredError scoped to the organization', async () => {
    fetchMock.mockResolvedValue(json({ errors: [{ message: 'Unauthorized' }] }, 401))

    await expect(shipstationApi('/labels', API_KEY)).rejects.toMatchObject({
      name: 'ConnectionExpiredError',
      code: 'CONNECTION_EXPIRED',
      scope: 'organization',
    })
    await expect(shipstationApi('/labels', API_KEY)).rejects.toBeInstanceOf(ConnectionExpiredError)
  })

  it('maps 403 to InsufficientPermissionsError', async () => {
    fetchMock.mockResolvedValue(json({ errors: [{ message: 'Forbidden' }] }, 403))

    await expect(
      shipstationApi({ endpoint: '/labels', apiKey: API_KEY, method: 'POST', body: {} })
    ).rejects.toBeInstanceOf(InsufficientPermissionsError)
  })

  it('maps 404 to NotFoundError carrying the provider message', async () => {
    fetchMock.mockResolvedValue(json({ errors: [{ message: 'Label se-9 not found' }] }, 404))

    await expect(shipstationApi('/labels/se-9', API_KEY)).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'Label se-9 not found',
    })
  })

  it('maps 400 and 422 to InvalidInputError', async () => {
    fetchMock.mockResolvedValue(json({ errors: [{ message: 'service_code is required' }] }, 400))
    await expect(
      shipstationApi({ endpoint: '/shipments', apiKey: API_KEY, method: 'POST', body: {} })
    ).rejects.toMatchObject({ name: 'InvalidInputError', message: 'service_code is required' })

    fetchMock.mockReset()
    fetchMock.mockResolvedValue(json({ errors: [{ message: 'Address is unverifiable' }] }, 422))
    await expect(
      shipstationApi({ endpoint: '/addresses/validate', apiKey: API_KEY, method: 'POST', body: [] })
    ).rejects.toBeInstanceOf(InvalidInputError)
  })

  it('maps 5xx to UpstreamServiceError with the status, not the provider prose', async () => {
    fetchMock.mockResolvedValue(json({ errors: [{ message: 'boom' }] }, 503))

    await expect(shipstationApi('/labels', API_KEY)).rejects.toMatchObject({
      name: 'UpstreamServiceError',
      statusCode: 503,
      message: 'ShipStation error 503',
    })
  })

  it('falls back to the status-derived message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('gateway timeout', { status: 400 }))

    await expect(shipstationApi('/labels', API_KEY)).rejects.toMatchObject({
      name: 'InvalidInputError',
      message:
        'ShipStation rejected the request. Check the shipment, label or tracking identifier.',
    })
  })

  it('reports a transport failure as UpstreamServiceError rather than leaking it raw', async () => {
    fetchMock.mockRejectedValue(new Error('The operation was aborted due to timeout'))

    await expect(shipstationApi('/labels', API_KEY)).rejects.toMatchObject({
      name: 'UpstreamServiceError',
      message: 'The operation was aborted due to timeout',
    })
  })
})

describe('rate limiting', () => {
  it('maps 429 to RateLimitError carrying retry-after, and does not retry', async () => {
    fetchMock.mockResolvedValue(
      json({ errors: [{ message: 'Too many requests' }] }, 429, { 'retry-after': '120' })
    )

    await expect(
      shipstationApi({ endpoint: '/labels/se-1/void', apiKey: API_KEY, method: 'PUT' })
    ).rejects.toMatchObject({ name: 'RateLimitError', retryAfterSeconds: 120 })

    // One attempt only: a write may not be idempotent, so the caller decides.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('leaves retryAfterSeconds undefined when the header is missing or unusable', async () => {
    fetchMock.mockResolvedValue(json({ errors: [{ message: 'Too many requests' }] }, 429))
    await expect(shipstationApi('/labels', API_KEY)).rejects.toMatchObject({
      name: 'RateLimitError',
      retryAfterSeconds: undefined,
    })

    fetchMock.mockReset()
    fetchMock.mockResolvedValue(json({}, 429, { 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' }))
    const err = await shipstationApi('/labels', API_KEY).catch((e) => e)
    expect(err).toBeInstanceOf(RateLimitError)
    expect(err.retryAfterSeconds).toBeUndefined()
  })
})

describe('api key redaction', () => {
  it('redacts the key when the provider echoes it back inside an error message', async () => {
    fetchMock.mockResolvedValue(
      json({ errors: [{ message: `API key ${API_KEY} is not valid for this store` }] }, 400)
    )

    const err = await shipstationApi('/labels', API_KEY).catch((e) => e)
    expect(err).toBeInstanceOf(InvalidInputError)
    expect(err.message).toBe('API key [redacted] is not valid for this store')
    expect(err.message).not.toContain(API_KEY)
  })

  it('redacts every occurrence, and caps the message length', async () => {
    const long = `${API_KEY} ${API_KEY} ${'x'.repeat(400)}`
    fetchMock.mockResolvedValue(json({ errors: [{ message: long }] }, 422))

    const err = await shipstationApi({
      endpoint: '/shipments',
      apiKey: API_KEY,
      method: 'POST',
      body: {},
    }).catch((e) => e)
    expect(err.message).not.toContain(API_KEY)
    expect(err.message.startsWith('[redacted] [redacted] ')).toBe(true)
    expect(err.message.length).toBe(250)
  })
})
