import {
  ConflictError,
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  NotFoundError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'

const QUICKBOOKS_PRODUCTION_API = 'https://quickbooks.api.intuit.com'
const QUICKBOOKS_SANDBOX_API = 'https://sandbox-quickbooks.api.intuit.com'

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your input parameters.',
  401: 'Invalid or expired credentials. Please reconnect in Settings > Apps > QuickBooks.',
  403: 'Insufficient permissions. Check your QuickBooks app scopes.',
  404: 'Resource not found.',
  429: 'Rate limit exceeded. Please try again later.',
  500: 'QuickBooks server error. Please try again later.',
}

/**
 * The API minor version this app is pinned to.
 *
 * Omitting `minorversion` currently defaults to 75 (the newest) — versions 1-74
 * were discontinued 2025-08-01 and values below 75 are ignored — so this is not
 * a live bug fix. It is insurance: a future minor version 76 would otherwise
 * change response shapes app-wide with no code change on our side.
 */
const QUICKBOOKS_MINOR_VERSION = '75'

/** QBO caps `requestid` at 50 characters. */
const REQUEST_ID_MAX_LENGTH = 50

/**
 * A QuickBooks `Fault.Error[0]` entry, attached to the error thrown by
 * {@link quickbooksApi} and read back with {@link quickbooksFault}.
 *
 * The `code` is the part that matters and the part that used to be dropped:
 * every 4xx looked identical to every other 4xx, so a caller could not tell a
 * retryable failure from a permanent one. Codes worth knowing:
 *
 * - `2300` — journal entry debits do not equal credits
 * - `6240` — duplicate document number
 * - `5010` — stale object version (someone else updated the row)
 */
export interface QuickbooksFault {
  code: string | null
  message: string | null
  detail: string | null
  element: string | null
}

/** Property key the fault is stashed under. Not exported — read via {@link quickbooksFault}. */
const FAULT_KEY = 'quickbooksFault'

/**
 * Read the QuickBooks fault attached to an error thrown by {@link quickbooksApi}.
 * Returns null for any other error, so it is safe to call in a bare catch.
 */
export function quickbooksFault(error: unknown): QuickbooksFault | null {
  if (!error || typeof error !== 'object') return null
  const fault = (error as Record<string, unknown>)[FAULT_KEY]
  return fault ? (fault as QuickbooksFault) : null
}

/** Attach the parsed fault to an error without disturbing its class or message. */
function withFault<E extends Error>(error: E, raw: any): E {
  const fault: QuickbooksFault = {
    code: raw?.code != null ? String(raw.code) : null,
    message: raw?.Message ?? null,
    detail: raw?.Detail ?? null,
    element: raw?.element ?? null,
  }
  Object.defineProperty(error, FAULT_KEY, { value: fault, enumerable: false })
  return error
}

/**
 * Append query parameters to a path that may or may not already carry a query
 * string — `/query?query=...` does, `/journalentry` does not.
 */
function withQueryParams(path: string, params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return path
  const separator = path.includes('?') ? '&' : '?'
  const query = entries.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&')
  return `${path}${separator}${query}`
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'QuickBooks not connected. Please reconnect in Settings → Apps → QuickBooks.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function quickbooksApi<T = unknown>(
  realmId: string,
  path: string,
  credential: string,
  options: {
    method?: string
    body?: Record<string, unknown>
    sandbox?: boolean
    headers?: Record<string, string>
    /**
     * Intuit's idempotency key. A repeat write carrying the same `requestid`
     * returns the ORIGINAL response instead of performing the operation again,
     * which is exactly the BullMQ-retry / network-timeout-then-retry case.
     *
     * Must be DETERMINISTIC from the posting identity — a random value
     * guarantees nothing. Max 50 characters, unique per realm.
     *
     * NOT a complete guard on its own: the retention window is undocumented, so
     * a re-run the next day is almost certainly not covered. Always pair it with
     * an auxx-side id map.
     */
    requestId?: string
  } = {}
): Promise<T> {
  const { method = 'GET', body, sandbox = false, headers: extraHeaders, requestId } = options
  const baseUrl = sandbox ? QUICKBOOKS_SANDBOX_API : QUICKBOOKS_PRODUCTION_API

  if (requestId && requestId.length > REQUEST_ID_MAX_LENGTH) {
    throw new InvalidInputError(
      `requestid must be at most ${REQUEST_ID_MAX_LENGTH} characters, got ${requestId.length}`
    )
  }

  const url = `${baseUrl}/v3/company/${realmId}${withQueryParams(path, {
    minorversion: QUICKBOOKS_MINOR_VERSION,
    requestid: requestId,
  })}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${credential}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      ...(body && { body: JSON.stringify(body) }),
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'QuickBooks request failed')
  }

  if (response.status === 204) return {} as T

  const data = await response.json()

  if (!response.ok) {
    const fault = data?.Fault?.Error?.[0]
    const faultMsg = fault?.Detail || fault?.Message
    const statusMsg = ERROR_MESSAGES[response.status]
    const message = faultMsg ?? statusMsg ?? `QuickBooks API error: ${response.status}`

    if (response.status === 401) throw withFault(new ConnectionExpiredError('organization'), fault)
    if (response.status === 403) {
      throw withFault(new InsufficientPermissionsError('organization'), fault)
    }
    if (response.status === 429) {
      const ra = Number(response.headers.get('Retry-After'))
      throw withFault(new RateLimitError(Number.isFinite(ra) ? ra : undefined), fault)
    }
    if (response.status === 404) throw withFault(new NotFoundError(message), fault)
    if (response.status === 409) throw withFault(new ConflictError(message), fault)
    if (response.status >= 500) {
      throw withFault(
        new UpstreamServiceError(`QuickBooks error ${response.status}`, response.status),
        fault
      )
    }
    if (response.status === 400 || response.status === 422) {
      throw withFault(new InvalidInputError(message), fault)
    }
    throw withFault(new Error(message), fault)
  }

  return data as T
}

export async function quickbooksQuery<T>(
  realmId: string,
  resource: string,
  credential: string,
  options: {
    where?: string
    limit?: number
    returnAll?: boolean
    sandbox?: boolean
  } = {}
): Promise<T[]> {
  const { where, limit = 50, returnAll = false, sandbox = false } = options
  const items: T[] = []
  const maxPerPage = returnAll ? 1000 : Math.min(limit, 1000)
  let startPosition = 1

  const countQuery = `SELECT COUNT(*) FROM ${resource}${where ? ` WHERE ${where}` : ''}`
  const countResult = await quickbooksApi<any>(
    realmId,
    `/query?query=${encodeURIComponent(countQuery)}`,
    credential,
    { sandbox }
  )
  const totalCount = countResult?.QueryResponse?.totalCount ?? 0
  if (totalCount === 0) return []

  const maxPages = 50
  for (let page = 0; page < maxPages; page++) {
    const query = `SELECT * FROM ${resource}${where ? ` WHERE ${where}` : ''} MAXRESULTS ${maxPerPage} STARTPOSITION ${startPosition}`
    const result = await quickbooksApi<any>(
      realmId,
      `/query?query=${encodeURIComponent(query)}`,
      credential,
      { sandbox }
    )

    const batch = result?.QueryResponse?.[resource] ?? []
    items.push(...batch)

    if (batch.length < maxPerPage) break
    if (!returnAll && items.length >= limit) break

    startPosition += maxPerPage
  }

  return returnAll ? items : items.slice(0, limit)
}

export async function getSyncToken(
  realmId: string,
  resource: string,
  id: string,
  credential: string,
  options: { sandbox?: boolean } = {}
): Promise<{ syncToken: string; entity: Record<string, any> }> {
  const result = await quickbooksApi<any>(
    realmId,
    `/${resource.toLowerCase()}/${id}`,
    credential,
    options
  )
  const entity = result[resource]
  return { syncToken: entity.SyncToken, entity }
}

export function buildAddress(input: {
  line1?: string
  city?: string
  postalCode?: string
  state?: string
}): Record<string, string> | undefined {
  if (!input.line1 && !input.city && !input.postalCode && !input.state) return undefined
  return {
    ...(input.line1 && { Line1: input.line1 }),
    ...(input.city && { City: input.city }),
    ...(input.postalCode && { PostalCode: input.postalCode }),
    ...(input.state && { CountrySubDivisionCode: input.state }),
  }
}

export function buildEmail(email?: string) {
  return email ? { Address: email } : undefined
}

export function buildPhone(phone?: string) {
  return phone ? { FreeFormNumber: phone } : undefined
}
