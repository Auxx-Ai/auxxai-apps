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
 * - Only GETs are issued; this app is read-only in its first pass.
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
 * GET a ShipStation V2 endpoint. `endpoint` is a path below `/v2`, e.g. `/labels`.
 * Undefined/empty query values are dropped rather than sent as blanks.
 */
export async function shipstationApi<T = unknown>(
  endpoint: string,
  apiKey: string,
  query: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  const url = new URL(`${SHIPSTATION_API}${endpoint}`)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'api-key': apiKey, Accept: 'application/json' },
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
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('retry-after'))
      throw new RateLimitError(Number.isFinite(retryAfter) ? retryAfter : undefined)
    }
    if (response.status === 404) throw new NotFoundError(message)
    if (response.status >= 500) {
      throw new UpstreamServiceError(`ShipStation error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) throw new InvalidInputError(message)
    throw new Error(message)
  }

  return response.json() as Promise<T>
}
