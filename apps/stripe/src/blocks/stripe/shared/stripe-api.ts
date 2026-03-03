export const STRIPE_API = 'https://api.stripe.com/v1'

const ERROR_MESSAGES: Record<number, string> = {
  401: 'Invalid Stripe API key. Please check your key in Settings → Apps → Stripe.',
  402: 'The payment cannot be processed. The card may have been declined.',
  403: 'The API key does not have permission for this operation. Check your key permissions in Stripe.',
  404: 'The requested resource was not found in Stripe.',
  429: 'Stripe rate limit exceeded. Please try again later.',
}

const STRIPE_ERROR_CODES: Record<string, string> = {
  card_declined: 'The card has been declined.',
  expired_card: 'The card has expired.',
  incorrect_cvc: 'The CVC number is incorrect.',
  incorrect_number: 'The card number is incorrect.',
  invalid_amount: 'The charge amount is invalid.',
  missing: 'The customer has no attached payment source.',
  resource_missing: 'The requested resource does not exist.',
  rate_limit: 'Too many requests. Please retry in a moment.',
}

function toFormBody(obj: Record<string, any>, prefix = ''): URLSearchParams {
  const params = new URLSearchParams()

  function flatten(data: any, path: string) {
    if (data === null || data === undefined) return
    if (typeof data === 'object' && !Array.isArray(data)) {
      for (const [key, val] of Object.entries(data)) {
        flatten(val, path ? `${path}[${key}]` : key)
      }
    } else if (Array.isArray(data)) {
      data.forEach((val, i) => flatten(val, `${path}[${i}]`))
    } else {
      params.append(path, String(data))
    }
  }

  flatten(obj, prefix)
  return params
}

export function toStripeMetadata(
  kvPairs: Array<{ key: string; value: string }>
): Record<string, string> {
  const metadata: Record<string, string> = {}
  for (const { key, value } of kvPairs) {
    if (key) metadata[key] = value ?? ''
  }
  return metadata
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Stripe account not connected. Please add your API key in Settings → Apps → Stripe.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function stripeApi<T = unknown>(
  method: string,
  endpoint: string,
  apiKey: string,
  options: {
    body?: Record<string, unknown>
    qs?: Record<string, string>
  } = {}
): Promise<T> {
  const { body, qs } = options

  const url = new URL(`${STRIPE_API}${endpoint}`)
  if (qs) {
    for (const [key, val] of Object.entries(qs)) {
      url.searchParams.set(key, val)
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }

  if (body) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
    fetchOptions.body = toFormBody(body).toString()
  }

  const response = await fetch(url.toString(), fetchOptions)

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const stripeError = errorBody?.error

    if (stripeError?.code && STRIPE_ERROR_CODES[stripeError.code]) {
      throw new Error(STRIPE_ERROR_CODES[stripeError.code])
    }
    if (stripeError?.message) {
      throw new Error(`Stripe error: ${stripeError.message}`)
    }

    const message =
      ERROR_MESSAGES[response.status] ??
      `Stripe API error: ${response.status} ${response.statusText}`
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

const MAX_PAGES = 100

export async function stripePaginatedGet(
  endpoint: string,
  apiKey: string,
  params: Record<string, string> = {},
  options: { returnAll: boolean; limit?: number }
): Promise<{ data: any[]; truncated: boolean }> {
  const items: any[] = []
  let startingAfter: string | undefined

  do {
    const qs: Record<string, string> = {
      ...params,
      limit: '100',
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    }
    const response = await stripeApi<any>('GET', endpoint, apiKey, { qs })
    items.push(...response.data)
    startingAfter = response.has_more ? items[items.length - 1].id : undefined

    if (!options.returnAll && items.length >= (options.limit ?? 50)) break
    if (items.length / 100 >= MAX_PAGES) break
  } while (startingAfter)

  const truncated = !!startingAfter
  const limited = options.returnAll ? items : items.slice(0, options.limit ?? 50)
  return { data: limited, truncated }
}
