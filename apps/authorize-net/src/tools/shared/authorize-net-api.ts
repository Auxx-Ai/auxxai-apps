// src/tools/shared/authorize-net-api.ts

// Two quirks drive this file: the transport status is almost always 200, so the real
// result is `messages.resultCode`; and the body is served with a UTF-8 BOM that
// `JSON.parse` rejects. The host is app code keyed on `environment`, never a user field.

import {
  ConnectionExpiredError,
  InsufficientPermissionsError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'
import type { AuthorizeNetCredentials, AuthorizeNetEnvironment } from './connection'

/** The two pinned origins. Selected by the connection's `environment` field. */
export const AUTHORIZE_NET_ENDPOINTS: Record<AuthorizeNetEnvironment, string> = {
  live: 'https://api.authorize.net/xml/v1/request.api',
  test: 'https://apitest.authorize.net/xml/v1/request.api',
}

const REQUEST_TIMEOUT_MS = 30_000

/** Authentication failures, which arrive as a 200 and must be recognised by code. */
const AUTH_ERROR_CODES = new Set(['E00007', 'E00008'])

/** Permission failures — the Transaction Details API not enabled on the account. */
const PERMISSION_ERROR_CODES = new Set(['E00011'])

export function authorizeNetEndpoint(environment: AuthorizeNetEnvironment): string {
  return AUTHORIZE_NET_ENDPOINTS[environment]
}

/** A single Authorize.net request. */
export interface AuthorizeNetRequest {
  credentials: AuthorizeNetCredentials
  /** The request element name, e.g. `getSettledBatchListRequest`. */
  request: string
  /** Members placed after `merchantAuthentication` inside the request element. */
  body?: Record<string, unknown>
  /** Injected for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch
}

/** An `Error` result code from the gateway, with the code it reported. */
export class AuthorizeNetApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status = 200) {
    super(message)
    this.name = 'AuthorizeNetApiError'
    this.code = code
    this.status = status
  }
}

/** Remove a leading UTF-8 BOM, which the gateway prepends and `JSON.parse` refuses. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

interface AuthorizeNetMessages {
  resultCode?: unknown
  message?: unknown
}

/** The gateway sends `message` as an array, or as a bare object on some calls. */
function firstMessage(messages: AuthorizeNetMessages): { code: string; text: string } {
  const raw = Array.isArray(messages.message) ? messages.message[0] : messages.message
  const entry = (raw ?? {}) as { code?: unknown; text?: unknown }
  return {
    code: typeof entry.code === 'string' ? entry.code : 'E00000',
    text: typeof entry.text === 'string' ? entry.text : 'Authorize.net rejected the request',
  }
}

/** Some surfaces wrap the payload in a `<name>Response` element and some return it bare. */
function unwrap(body: Record<string, unknown>, request: string): Record<string, unknown> {
  const key = `${request.replace(/Request$/, '')}Response`
  const inner = body[key]
  return inner && typeof inner === 'object' && !Array.isArray(inner)
    ? (inner as Record<string, unknown>)
    : body
}

/** Call the gateway and return its parsed body. Nothing retries; a 429 throws `RateLimitError`. */
export async function authorizeNetApi<T = Record<string, unknown>>(
  request: AuthorizeNetRequest
): Promise<T> {
  const { credentials, request: name, body = {}, fetchImpl } = request
  const send = fetchImpl ?? fetch
  const payload = {
    [name]: {
      merchantAuthentication: {
        name: credentials.apiLoginId,
        transactionKey: credentials.transactionKey,
      },
      ...body,
    },
  }

  let response: Response
  try {
    response = await send(authorizeNetEndpoint(credentials.environment), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new UpstreamServiceError(
      err instanceof Error ? err.message : 'Authorize.net request failed'
    )
  }

  if (response.status === 429) throw new RateLimitError(readRetryAfterSeconds(response))
  if (!response.ok) {
    throw new UpstreamServiceError(`Authorize.net error ${response.status}`, response.status)
  }

  const text = stripBom(await response.text())
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new UpstreamServiceError('Authorize.net returned a response that was not JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new UpstreamServiceError('Authorize.net returned a response that was not an object.')
  }

  const envelope = unwrap(parsed as Record<string, unknown>, name)
  const messages = (envelope.messages ?? {}) as AuthorizeNetMessages
  if (messages.resultCode !== 'Ok') {
    const { code, text: detail } = firstMessage(messages)
    // The transaction key can be echoed back in a validation message.
    const safe = detail.split(credentials.transactionKey).join('[redacted]').slice(0, 250)
    if (AUTH_ERROR_CODES.has(code)) throw new ConnectionExpiredError('organization')
    if (PERMISSION_ERROR_CODES.has(code)) throw new InsufficientPermissionsError('organization')
    throw new AuthorizeNetApiError(`${code}: ${safe}`, code, response.status)
  }

  return envelope as T
}

/** Seconds from `retry-after`, or undefined — a missing header must not read as "retry now". */
function readRetryAfterSeconds(response: Response): number | undefined {
  const header = response.headers.get('retry-after')
  if (header === null) return undefined
  const seconds = Number(header)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}
