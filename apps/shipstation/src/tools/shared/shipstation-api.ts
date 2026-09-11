// src/tools/shared/shipstation-api.ts

/**
 * Shared ShipStation V2 REST client.
 *
 * The request contract here is copied from the live read-only probe in the
 * platform repo (`packages/lib/scripts/probe-shipstation-packages.ts`), which
 * is the only code path proven against a real account:
 *
 * - Auth is the raw `api-key` header. ShipStation V2 does NOT accept
 *   `Authorization: Bearer <key>`.
 * - Redirects are refused, so a provider-returned URL can never receive the
 *   credential.
 *
 * Writes were added afterwards. V2 spreads its mutations across GET, POST, PUT
 * and DELETE (`POST /v2/shipments`, `PUT /v2/labels/{id}/void`,
 * `DELETE /v2/shipments/{id}/tags/{tag_name}`), so the method and an optional
 * JSON body are now caller-supplied. Everything above stays exactly as the
 * probe proved it: same header, same redirect refusal, same timeout, same
 * redaction, same status-to-error mapping. Nothing here retries. A 429 surfaces
 * as `RateLimitError` and the caller decides, because a write may not be
 * idempotent.
 */

import {
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'

export const SHIPSTATION_ORIGIN = 'https://api.shipstation.com'
export const SHIPSTATION_API = `${SHIPSTATION_ORIGIN}/v2`

const REQUEST_TIMEOUT_MS = 30_000

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'ShipStation rejected the request. Check the shipment, label or tracking identifier.',
  401: 'Invalid ShipStation API key. Update it in Settings → Apps → ShipStation.',
  403: 'This ShipStation API key does not have access to that resource.',
  404: 'No such shipment or label in this ShipStation account.',
  429: 'ShipStation rate limit exceeded. Please try again shortly.',
}

/** The HTTP methods ShipStation V2 uses. There is no PATCH anywhere in the surface. */
export type ShipStationMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** Query values; `undefined` and `''` are dropped rather than sent as blanks. */
export type ShipStationQuery = Record<string, string | number | boolean | undefined>

/** A single ShipStation V2 request. */
export interface ShipStationRequest {
  /** Path below `/v2`, e.g. `/labels` or `/labels/se-123/void`. */
  endpoint: string
  /** The V2 API key. A `secret` connection's `value` IS the key. */
  apiKey: string
  /** Defaults to `GET`. */
  method?: ShipStationMethod
  query?: ShipStationQuery
  /**
   * JSON request body. Serialized with `JSON.stringify`, so an array is fine
   * (`POST /v2/addresses/validate` takes one). Not sent on a `GET`: `fetch`
   * rejects a GET with a body outright, so passing one is a caller bug rather
   * than something to forward.
   */
  body?: unknown
}

/**
 * Throw the structured CONNECTION_NOT_FOUND error the platform maps to a
 * "Connection Required" prompt rather than a generic tool failure.
 */
export function throwConnectionNotFound(): never {
  const err = new Error(
    'ShipStation is not connected. Add your V2 API key in Settings → Apps → ShipStation.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/** A ShipStation error body: `{ errors: [{ error_code, message, ... }] }`. */
interface ShipStationErrorBody {
  errors?: { error_source?: string; error_type?: string; error_code?: string; message?: string }[]
}

/**
 * Call a ShipStation V2 endpoint with a method, query and optional JSON body.
 *
 * @example
 * await shipstationApi<VoidResult>({
 *   endpoint: `/labels/${id}/void`,
 *   apiKey,
 *   method: 'PUT',
 * })
 */
export async function shipstationApi<T = unknown>(request: ShipStationRequest): Promise<T>
/**
 * GET a ShipStation V2 endpoint. `endpoint` is a path below `/v2`, e.g. `/labels`.
 * Undefined/empty query values are dropped rather than sent as blanks.
 *
 * This positional form is the original read-only signature, kept so the tool
 * servers and the connector that use it are untouched by write support.
 */
export async function shipstationApi<T = unknown>(
  endpoint: string,
  apiKey: string,
  query?: ShipStationQuery
): Promise<T>
export async function shipstationApi<T = unknown>(
  endpointOrRequest: string | ShipStationRequest,
  apiKeyArg?: string,
  queryArg: ShipStationQuery = {}
): Promise<T> {
  // The two forms never overlap structurally: one starts with a string, the
  // other with an object, so the runtime test is exact rather than a guess at
  // which keys are present.
  const req: ShipStationRequest =
    typeof endpointOrRequest === 'string'
      ? { endpoint: endpointOrRequest, apiKey: apiKeyArg as string, query: queryArg }
      : endpointOrRequest

  const { endpoint, apiKey, method = 'GET', query = {}, body } = req

  const url = new URL(`${SHIPSTATION_API}${endpoint}`)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { 'api-key': apiKey, Accept: 'application/json' }
  // A body-less POST is normal here (`POST /v2/shipments/{id}/tags/{tag_name}`),
  // so the content type is attached to the body, not to the method.
  const sendBody = method !== 'GET' && body !== undefined
  if (sendBody) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: sendBody ? JSON.stringify(body) : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new UpstreamServiceError(
      err instanceof Error ? err.message : 'ShipStation request failed'
    )
  }

  if (!response.ok) {
    let message = HTTP_ERROR_MESSAGES[response.status] ?? `ShipStation error ${response.status}`
    try {
      const body = (await response.json()) as ShipStationErrorBody
      const detail = body.errors?.[0]?.message
      // The key can be echoed back inside a provider message; never surface it.
      if (detail) message = detail.split(apiKey).join('[redacted]').slice(0, 250)
    } catch {
      // Keep the status-derived message.
    }

    if (response.status === 401) throw new ConnectionExpiredError('organization')
    if (response.status === 403) throw new InsufficientPermissionsError('organization')
    if (response.status === 429) throw new RateLimitError(readRetryAfterSeconds(response))
    if (response.status === 404) throw new NotFoundError(message)
    if (response.status >= 500) {
      throw new UpstreamServiceError(`ShipStation error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) throw new InvalidInputError(message)
    throw new Error(message)
  }

  return readJsonBody<T>(response)
}

/**
 * Seconds from a `retry-after` header, or `undefined` when it is absent or not
 * a usable number. A missing header must not become `0`: a caller treating that
 * as "retry now" would hammer an endpoint that just rate-limited it.
 */
function readRetryAfterSeconds(response: Response): number | undefined {
  const header = response.headers.get('retry-after')
  if (header === null) return undefined
  const seconds = Number(header)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}

/**
 * Parse a success body, tolerating an empty one.
 *
 * Several V2 writes answer 204 with nothing at all, and `response.json()`
 * throws on an empty body, so the body is read as text first and an empty one
 * resolves to `undefined`. A non-empty body that is not JSON is an upstream
 * fault, not a caller error.
 */
async function readJsonBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) return undefined as T
  const text = await response.text()
  if (text.trim() === '') return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new UpstreamServiceError('ShipStation returned a response that was not JSON.')
  }
}
