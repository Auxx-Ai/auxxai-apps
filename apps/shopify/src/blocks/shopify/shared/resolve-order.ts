// src/blocks/shopify/shared/resolve-order.ts

import { InvalidInputError, NotFoundError } from '@auxx/sdk/server'
import { shopifyApi } from './shopify-api'

/**
 * Run an order operation against a Shopify order id, order GID, or order number.
 *
 * Shopify's `/orders/{id}` endpoints only accept the numeric order *id*, so an
 * order *number* like "1001" (or its display name "#1001") 404s there. This
 * helper resolves any of those references to a real id before running `op`:
 *
 * - GIDs (`gid://shopify/Order/123`) are stripped to their numeric id.
 * - Explicit names (`#1001`) are looked up via `/orders.json?name=`.
 * - A bare numeric is tried as a real id first (fast path, keeps prior
 *   behavior); only if Shopify reports it missing is it re-resolved as an
 *   order number and retried.
 *
 * `op` must make no changes when the id is missing (a 404 short-circuits before
 * any mutation), which holds for get/update/delete/cancel/refund — so retrying
 * on `NotFoundError` is safe.
 */
export async function withOrderId<T>(
  shopDomain: string,
  token: string,
  ref: string,
  op: (numericId: string) => Promise<T>
): Promise<T> {
  const raw = String(ref ?? '').trim()
  if (!raw) throw new InvalidInputError('An order id or order number is required.')

  // GID → numeric id (no lookup needed).
  if (raw.startsWith('gid://shopify/Order/')) {
    return op(raw.split('/').pop() ?? raw)
  }

  // Explicit order name (e.g. "#1001") → resolve to id.
  if (raw.startsWith('#')) {
    return op(await orderIdFromName(shopDomain, token, raw))
  }

  // Bare numeric: real id vs order number is ambiguous. Try it as a real id
  // first; on not-found, fall back to an order-number lookup and retry.
  if (/^\d+$/.test(raw)) {
    try {
      return await op(raw)
    } catch (err) {
      if (err instanceof NotFoundError) {
        return op(await orderIdFromName(shopDomain, token, `#${raw}`))
      }
      throw err
    }
  }

  // Anything else → best-effort name lookup.
  return op(await orderIdFromName(shopDomain, token, raw))
}

/** Resolve an order name/number (e.g. "#1001") to its numeric order id. */
async function orderIdFromName(shopDomain: string, token: string, name: string): Promise<string> {
  const result = await shopifyApi<{ orders: Array<{ id: number | string }> }>(
    shopDomain,
    token,
    '/orders.json',
    { qs: { name, status: 'any', limit: '1', fields: 'id' } }
  )
  const id = result.orders?.[0]?.id
  if (!id) throw new NotFoundError()
  return String(id)
}
