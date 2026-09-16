// src/tools/shared/affirm-api.ts

/**
 * Shared Affirm REST client.
 *
 * GET, and — since build plan §7 — POST with a JSON body for capture, refund
 * and void. ⚠️ The account has **production keys and no sandbox** (probe §1),
 * so a POST issued from here lands on a real customer's loan. Nothing in this
 * file has ever been run against the live write endpoints; every write test
 * stubs `fetch`.
 *
 * The write path changes exactly two things about a request — the method and
 * the body — and adds one optional header, `Idempotency-Key`. Everything the
 * read path already does is unchanged and applies identically: the 30s timeout,
 * `redirect: 'error'`, the SDK error mapping, the private-key redaction, and
 * **no retries**.
 *
 * ⚠️ The no-retry rule matters more on a write than it did on a read. A retried
 * refund without an idempotency key refunds twice. Whether a given call is
 * replayable is the CALLER's decision — it is the caller who supplies (or does
 * not supply) the key — so this client never makes it on their behalf.
 *
 * Rules copied from the ShipStation client, for the same reasons:
 *
 * - **Redirects are refused.** Affirm's paging returns provider-controlled
 *   values; a credential must never be replayed to a host we did not choose.
 *   `affirmPageQuery()` exists so a `next_page` value is re-issued against our
 *   own pinned origin as query parameters, never followed as a URL.
 * - **Nothing retries.** A 429 surfaces as `RateLimitError` and the caller
 *   decides. Affirm's rate limits and whether it sends `Retry-After` are both
 *   unproven (probe §6.8), so the header is read defensively.
 * - The private key is redacted out of any provider message before it is
 *   surfaced.
 *
 * `merchant_id` is a REQUIRED query parameter on every settlement and
 * transaction endpoint, and no platform layer supplies it. It is therefore not
 * a caller-supplied query key at all: the client takes the whole
 * {@link AffirmCredentials} and writes `merchant_id` itself, last, so it cannot
 * be forgotten and cannot be overridden by a caller's query object.
 *
 * HTTP Basic (public key : private key) is applied by the platform for
 * connection-driven calls, but this client sends the header explicitly anyway
 * — an implicit injection is neither testable nor auditable.
 */

import {
  ConflictError,
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'
import type { AffirmCredentials } from './connection'

/**
 * The single pinned origin. The base URL is app code keyed on region, never a
 * free-form user field (build plan §3.1). Canada would add a sibling constant
 * here; it is out of scope.
 */
export const AFFIRM_ORIGIN = 'https://api.affirm.com'

/** Every documented settlement and transaction endpoint lives below `/api/v1`. */
export const AFFIRM_API = `${AFFIRM_ORIGIN}/api/v1`

const REQUEST_TIMEOUT_MS = 30_000

/** Affirm's own maximum page size. The API default is 5, so always send one. */
export const AFFIRM_MAX_LIMIT = 1000

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Affirm rejected the request. Check the merchant ID, date range or paging cursor.',
  401: 'Invalid Affirm API key pair. Update it in Settings → Apps → Affirm.',
  403: 'This Affirm API key pair does not have access to that resource.',
  404: 'No such settlement or transaction in this Affirm account.',
  409: 'Affirm refused this operation in the charge’s current state.',
  429: 'Affirm rate limit exceeded. Please try again shortly.',
}

/**
 * The two methods the Affirm surface uses. Reads are GET; capture, refund and
 * void are all `POST /transactions/{id}/<op>`. There is no PUT, PATCH or
 * DELETE anywhere in the documented API.
 */
export type AffirmMethod = 'GET' | 'POST'

/**
 * An `Idempotency-Key` must be header-safe ASCII. It is derived, never
 * caller-supplied verbatim (see `shared/writes.ts`), but the check is kept here
 * as the last line: a caller-supplied `reference_id` is up to 128 free-form
 * characters, and a newline reaching a request header is header injection.
 */
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_.:-]{1,128}$/

/** Query values; `undefined` and `''` are dropped rather than sent as blanks. */
export type AffirmQuery = Record<string, string | number | boolean | undefined>

/** A single Affirm request. */
export interface AffirmRequest {
  /** Path below `/api/v1`, e.g. `/settlements/daily` or `/transactions`. */
  endpoint: string
  /** The bound connection's three fields. Supplies auth AND `merchant_id`. */
  credentials: AffirmCredentials
  /** Defaults to `GET`. */
  method?: AffirmMethod
  /** Extra query parameters. `merchant_id` here is ignored — the client owns it. */
  query?: AffirmQuery
  /**
   * JSON request body, sent only on a `POST`. Serialized with `JSON.stringify`.
   * `undefined` members are dropped by `JSON.stringify` itself, so a write
   * server can build the object with optional keys and send only what was set.
   *
   * An empty object is still SENT on a POST: every Affirm write documents a
   * fully-optional body, and `{}` is the documented "all defaults" request.
   */
  body?: Record<string, unknown>
  /**
   * Affirm's optional `Idempotency-Key` header — *"Unique identifier
   * pre-generated by the client and used by the server to recognize successive
   * calls to the same endpoint."*
   *
   * Ignored on a GET, where it means nothing. Rejected outright if it is not
   * header-safe ASCII.
   */
  idempotencyKey?: string
}

/** Affirm error bodies vary; these are the shapes seen in its documentation. */
interface AffirmErrorBody {
  message?: string
  error?: string
  /** Affirm's machine-readable code, e.g. `invalid-request`. */
  code?: string
  type?: string
}

/**
 * Turn Affirm's `next_page` / `prev_page` value into query parameters for the
 * NEXT request against our own pinned origin.
 *
 * Affirm documents these as *"URL-encoded pagination parameters"* rather than a
 * URL, but the two are easy to confuse and one of them is dangerous. If the
 * value does parse as an absolute URL, its origin and path are DISCARDED and
 * only its search parameters survive — following it would hand the API key to
 * whatever host Affirm names.
 *
 * @example
 * const page = affirmPageQuery(body.next_page)
 * if (page) await affirmApi({ endpoint: '/settlements/events', credentials, query: page })
 */
export function affirmPageQuery(value: unknown): AffirmQuery | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  let search = value.trim()
  try {
    search = new URL(search).search
  } catch {
    // Not an absolute URL — the documented case. Use the value as-is.
  }
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const query: AffirmQuery = {}
  for (const [key, entry] of params.entries()) {
    // `merchant_id` is re-applied from the credentials on every request, so a
    // provider-echoed one is dropped rather than trusted.
    if (key !== 'merchant_id' && entry !== '') query[key] = entry
  }
  return Object.keys(query).length ? query : null
}

/**
 * Call an Affirm `/api/v1` endpoint and parse its JSON body.
 *
 * `merchant_id` is added automatically from `credentials`. Undefined and empty
 * query values are dropped rather than sent as blanks.
 *
 * @example
 * const page = await affirmApi<AffirmDailyPage>({
 *   endpoint: '/settlements/daily',
 *   credentials,
 *   query: { after: '2026-09-01', before: '2026-09-16', limit: AFFIRM_MAX_LIMIT },
 * })
 *
 * @example
 * const refund = await affirmApi<AffirmWriteResult>({
 *   endpoint: `/transactions/${encodeURIComponent(id)}/refund`,
 *   credentials,
 *   method: 'POST',
 *   body: { amount: 1000, reference_id: 'rma-41' },
 *   idempotencyKey: key,
 * })
 */
export async function affirmApi<T = unknown>(request: AffirmRequest): Promise<T> {
  const { endpoint, credentials, method = 'GET', query = {}, body, idempotencyKey } = request

  const url = new URL(`${AFFIRM_API}${endpoint}`)
  for (const [key, value] of Object.entries(query)) {
    if (key === 'merchant_id') continue
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  // Written last and unconditionally: this is the parameter the API rejects the
  // request without, and the one a caller is most likely to leave out.
  //
  // ⚠️ CHOICE, carried onto the writes: the capture / refund / void references
  // document no query parameters at all, and Basic auth already identifies the
  // merchant. It is sent anyway, because this account's own settlement rows
  // carry BOTH `merchant_id` and `initiating_merchant_id` — a merchant
  // structure where an unscoped write is the more frightening guess of the two
  // — and because one invariant that always holds beats a per-method branch.
  // Unverifiable without a live write; flagged rather than presented as proven.
  url.searchParams.set('merchant_id', credentials.merchantId)

  const headers: Record<string, string> = {
    Authorization: `Basic ${base64(`${credentials.publicKey}:${credentials.privateKey}`)}`,
    Accept: 'application/json',
  }
  // A body is attached to the METHOD, not to its presence: `fetch` rejects a
  // GET carrying a body outright, and every Affirm write takes a JSON object
  // even when every member of it is optional.
  const sendBody = method !== 'GET'
  if (sendBody) headers['Content-Type'] = 'application/json'
  if (sendBody && idempotencyKey !== undefined) {
    if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
      throw new InvalidInputError('The Affirm idempotency key is not header-safe.')
    }
    headers['Idempotency-Key'] = idempotencyKey
  }

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: sendBody ? JSON.stringify(body ?? {}) : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'Affirm request failed')
  }

  if (!response.ok) throw await affirmError(response, credentials.privateKey)

  return readJsonBody<T>(response)
}

/** Map an Affirm HTTP failure onto the SDK's error contract. Never retries. */
async function affirmError(response: Response, privateKey: string): Promise<Error> {
  let message = HTTP_ERROR_MESSAGES[response.status] ?? `Affirm error ${response.status}`
  try {
    const body = (await response.json()) as AffirmErrorBody
    const detail = body.message ?? body.error
    // A provider message can echo the request back; never surface the key.
    if (detail) message = detail.split(privateKey).join('[redacted]').slice(0, 250)
  } catch {
    // Keep the status-derived message.
  }

  if (response.status === 401) return new ConnectionExpiredError('organization')
  if (response.status === 403) return new InsufficientPermissionsError('organization')
  if (response.status === 429) return new RateLimitError(readRetryAfterSeconds(response))
  if (response.status === 404) return new NotFoundError(message)
  // 409 is a DOCUMENTED response on capture, refund and void, and it is the
  // whole of this client's opinion about the capture/refund/void boundary:
  // Affirm decides which operation a charge is in state for, and a refusal is
  // reported rather than worked around. `ConflictError` carries `CONFLICT`, so
  // the caller can tell "wrong operation for this state" from "bad request".
  if (response.status === 409) return new ConflictError(message)
  if (response.status >= 500) {
    return new UpstreamServiceError(`Affirm error ${response.status}`, response.status)
  }
  if (response.status === 400 || response.status === 422) return new InvalidInputError(message)
  return new Error(message)
}

/**
 * Seconds from a `retry-after` header, or `undefined` when it is absent or not
 * a usable number. A missing header must not become `0`: a caller reading that
 * as "retry now" would hammer an endpoint that just rate-limited it.
 */
function readRetryAfterSeconds(response: Response): number | undefined {
  const header = response.headers.get('retry-after')
  if (header === null) return undefined
  const seconds = Number(header)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}

/** Parse a success body, tolerating an empty one. */
async function readJsonBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) return undefined as T
  const text = await response.text()
  if (text.trim() === '') return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new UpstreamServiceError('Affirm returned a response that was not JSON.')
  }
}

/**
 * Base64 for the Basic header. `btoa` is the runtime-agnostic choice the other
 * apps use; the input here is ASCII API keys, so its Latin-1 limit is not a
 * constraint.
 */
function base64(value: string): string {
  return btoa(value)
}
