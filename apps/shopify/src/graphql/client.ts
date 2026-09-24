// src/graphql/client.ts

import type { ConnectorExecuteArgs } from '@auxx/sdk/data-connectors'
import { ConnectionExpiredError, InsufficientPermissionsError } from '@auxx/sdk/server'
import { getShopDomain, getShopifyToken } from '../blocks/shopify/shared/shopify-api'

/** The one Admin GraphQL version this app speaks (plans/apps/shopify/shopify-v3-graphql-plan.md §5). */
export const ADMIN_API_VERSION = '2026-07'

/** Shop endpoint and auth headers for one connection. */
export interface ShopifyHttp {
  shopDomain: string
  headers: Record<string, string>
}

/** A GraphQL result, or a throttle the caller turns into `rateLimited` on the same cursor. */
export type GraphqlPage<T> = { ok: true; data: T } | { ok: false; retryAfterMs?: number }

interface GraphqlError {
  message?: string
  extensions?: { code?: string }
}

interface GraphqlBody<T> {
  data?: T | null
  errors?: GraphqlError[] | string
  extensions?: {
    cost?: {
      requestedQueryCost?: number
      throttleStatus?: { currentlyAvailable?: number; restoreRate?: number }
    }
    search?: Array<{ warnings?: Array<{ field?: string; message?: string }> | null }>
  }
}

let versionWarned = false

/** Resolve the shop endpoint and token from a connector connection, or throw. */
export function shopifyHttp(connection: ConnectorExecuteArgs['connection']): ShopifyHttp {
  const token = getShopifyToken(connection)
  if (!token) throw new Error('shopify: missing connection (requiresConnection)')
  const shopDomain = getShopDomain(connection?.metadata)
  if (!shopDomain) throw new Error('shopify: connection metadata is missing the shop domain')
  return {
    shopDomain,
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
  }
}

/** `Retry-After` in ms, or undefined when Shopify sent none (never 0 for a missing header). */
export function retryAfterMs(res: {
  headers: { get: (name: string) => string | null }
}): number | undefined {
  const header = res.headers.get('Retry-After')
  const seconds = header === null ? Number.NaN : Number(header)
  return Number.isFinite(seconds) ? seconds * 1000 : undefined
}

/** Wait until the bucket refills enough for the query; undefined when the cost block is unusable. */
function throttleRetryMs(cost: NonNullable<GraphqlBody<unknown>['extensions']>['cost']) {
  const requested = cost?.requestedQueryCost
  const available = cost?.throttleStatus?.currentlyAvailable
  const rate = cost?.throttleStatus?.restoreRate
  if (typeof requested !== 'number' || typeof available !== 'number' || typeof rate !== 'number')
    return undefined
  if (!(rate > 0) || requested <= available) return undefined
  return Math.ceil(((requested - available) / rate) * 1000)
}

/**
 * One Admin GraphQL call. A response carrying `data` AND `errors` is an error, never a
 * partial success, and a search warning throws because Shopify ignores an invalid filter.
 */
export async function shopifyGraphql<T>(
  http: ShopifyHttp,
  query: string,
  variables: Record<string, unknown>,
): Promise<GraphqlPage<T>> {
  const res = await fetch(
    `https://${http.shopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: http.headers,
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(10_000),
    },
  )

  const served = res.headers.get('X-Shopify-API-Version')
  if (served && served !== ADMIN_API_VERSION && !versionWarned) {
    versionWarned = true
    console.warn(`shopify: requested Admin API ${ADMIN_API_VERSION}, Shopify served ${served}`)
  }

  if (res.status === 429) return { ok: false, retryAfterMs: retryAfterMs(res) }
  if (res.status === 401) throw new ConnectionExpiredError('organization')
  if (res.status === 403) throw new InsufficientPermissionsError('organization')
  if (!res.ok) throw new Error(`shopify: Admin GraphQL responded ${res.status}`)

  const body = (await res.json()) as GraphqlBody<T>
  if (typeof body.errors === 'string') {
    throw new Error(`shopify: Admin GraphQL failed: ${body.errors}`)
  }
  if (body.errors?.length) {
    const codes = body.errors.map((e) => e.extensions?.code)
    if (codes.includes('THROTTLED')) {
      return { ok: false, retryAfterMs: throttleRetryMs(body.extensions?.cost) }
    }
    // Shopify returns 200 + ACCESS_DENIED (and nulls the field) for a missing scope.
    if (codes.includes('ACCESS_DENIED')) throw new InsufficientPermissionsError('organization')
    const messages = body.errors.map((e) => e.message ?? 'unknown error').join('; ')
    throw new Error(`shopify: Admin GraphQL failed: ${messages}`)
  }

  const warnings = (body.extensions?.search ?? []).flatMap((s) => s.warnings ?? [])
  if (warnings.length) {
    const messages = warnings.map((w) => `${w.field ?? '?'}: ${w.message ?? 'warning'}`)
    throw new Error(`shopify: Admin GraphQL search filter rejected: ${messages.join('; ')}`)
  }

  if (body.data == null) throw new Error('shopify: Admin GraphQL returned no data')
  return { ok: true, data: body.data }
}
