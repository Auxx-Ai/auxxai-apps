// src/blocks/shopify/shared/shopify-api.ts

import { ConnectionExpiredError } from '@auxx/sdk/server'

const API_VERSION = '2024-10'

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your input parameters.',
  401: 'Invalid credentials. Please reconnect in Settings -> Apps -> Shopify.',
  403: 'Insufficient permissions. Please check your Shopify app permissions.',
  404: 'Resource not found.',
  422: 'Validation error. Please check your input data.',
  429: 'Rate limit exceeded. Please try again later.',
}

export function throwConnectionNotFound(): never {
  const err = new Error(
    'Shopify not connected. Please connect in Settings -> Apps -> Shopify.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/**
 * Extract the full Shopify domain from connection metadata.
 * The shop subdomain is stored at `metadata.connectionVariables.shop` (e.g., "auxxai").
 * Returns the full domain (e.g., "auxxai.myshopify.com").
 */
export function getShopDomain(metadata: Record<string, any> | undefined): string {
  const vars = metadata?.connectionVariables as Record<string, string> | undefined
  const shop = vars?.shop
  if (!shop) return ''
  // If already a full domain, return as-is
  if (shop.includes('.')) return shop
  return `${shop}.myshopify.com`
}

export async function shopifyApi<T = unknown>(
  shopDomain: string,
  accessToken: string,
  path: string,
  options: { method?: string; body?: Record<string, unknown>; qs?: Record<string, string> } = {}
): Promise<T> {
  const { method = 'GET', body, qs } = options

  const url = new URL(`https://${shopDomain}/admin/api/${API_VERSION}${path}`)
  if (qs) {
    for (const [k, v] of Object.entries(qs)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v)
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  if (response.status === 204) return {} as T

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ConnectionExpiredError('organization')
    }

    const statusMsg = ERROR_MESSAGES[response.status]
    const apiErrors = data?.errors
    const message = apiErrors
      ? typeof apiErrors === 'string'
        ? apiErrors
        : JSON.stringify(apiErrors)
      : (statusMsg ?? `Shopify API error: ${response.status} ${response.statusText}`)
    throw new Error(message)
  }

  return data as T
}

export async function shopifyApiGetAll<T>(
  shopDomain: string,
  accessToken: string,
  path: string,
  resourceKey: string,
  qs?: Record<string, string>
): Promise<T[]> {
  const items: T[] = []

  const url = new URL(`https://${shopDomain}/admin/api/${API_VERSION}${path}`)
  if (qs) {
    for (const [k, v] of Object.entries(qs)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v)
    }
  }

  let currentUrl = url.toString()

  for (let page = 0; page < 50; page++) {
    const response = await fetch(currentUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ConnectionExpiredError('organization')
      }
      const data = await response.json().catch(() => ({}))
      throw new Error(data?.errors || `Shopify API error: ${response.status}`)
    }

    const data = await response.json()
    const batch = data[resourceKey] || []
    items.push(...batch)

    // Parse Link header for next page
    const linkHeader = response.headers.get('Link')
    let nextUrl: string | undefined
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
      if (nextMatch) nextUrl = nextMatch[1]
    }

    if (!nextUrl || batch.length === 0) break
    currentUrl = nextUrl
  }

  return items
}
