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
  } = {},
): Promise<T> {
  const { method = 'GET', body, sandbox = false, headers: extraHeaders } = options
  const baseUrl = sandbox ? QUICKBOOKS_SANDBOX_API : QUICKBOOKS_PRODUCTION_API

  const response = await fetch(`${baseUrl}/v3/company/${realmId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  if (response.status === 204) return {} as T

  const data = await response.json()

  if (!response.ok) {
    const fault = data?.Fault?.Error?.[0]
    const faultMsg = fault?.Detail || fault?.Message
    const statusMsg = ERROR_MESSAGES[response.status]
    throw new Error(faultMsg ?? statusMsg ?? `QuickBooks API error: ${response.status}`)
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
  } = {},
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
    { sandbox },
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
      { sandbox },
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
  options: { sandbox?: boolean } = {},
): Promise<{ syncToken: string; entity: Record<string, any> }> {
  const result = await quickbooksApi<any>(
    realmId,
    `/${resource.toLowerCase()}/${id}`,
    credential,
    options,
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
