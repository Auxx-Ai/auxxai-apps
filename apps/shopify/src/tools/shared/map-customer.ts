// src/tools/shared/map-customer.ts

/**
 * Tool-surface mapper for a Shopify Customer (REST resource).
 *
 * Returns a structured shape independent of the workflow block's flat
 * stringified surface. See plans/kopilot/apps/shopify-overhaul.md §7.
 */
export interface MappedShopifyCustomer {
  shopifyId: string
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  createdAt: string
  ordersCount: number
  totalSpent: { amount: string; currencyCode: string }
  state: 'disabled' | 'invited' | 'enabled' | 'declined'
  tags: string[]
}

export interface MappedShopifyCustomerWithAddress extends MappedShopifyCustomer {
  defaultAddress: {
    address1: string | null
    city: string | null
    country: string | null
    zip: string | null
  } | null
  recentOrderIds: string[]
}

// Shopify REST returns numeric ids; expose them as GIDs so tool consumers can
// pass them to GraphQL-shaped follow-ups without translation.
export function customerGid(numericId: number | string): string {
  return `gid://shopify/Customer/${numericId}`
}

export function orderGid(numericId: number | string): string {
  return `gid://shopify/Order/${numericId}`
}

export function productGid(numericId: number | string): string {
  return `gid://shopify/Product/${numericId}`
}

export function variantGid(numericId: number | string): string {
  return `gid://shopify/ProductVariant/${numericId}`
}

export function shopGid(numericId: number | string): string {
  return `gid://shopify/Shop/${numericId}`
}

export function locationGid(numericId: number | string): string {
  return `gid://shopify/Location/${numericId}`
}

/** Extract the numeric id from a Shopify GID. */
export function gidToNumeric(gid: string): string {
  const parts = gid.split('/')
  return parts[parts.length - 1] ?? gid
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCustomer(c: any, defaultCurrency: string): MappedShopifyCustomer {
  return {
    shopifyId: customerGid(c.id),
    email: c.email ?? null,
    phone: c.phone ?? null,
    firstName: c.first_name ?? null,
    lastName: c.last_name ?? null,
    createdAt: c.created_at ?? '',
    ordersCount: typeof c.orders_count === 'number' ? c.orders_count : 0,
    totalSpent: {
      amount: typeof c.total_spent === 'string' ? c.total_spent : '0.00',
      currencyCode: c.currency ?? defaultCurrency,
    },
    state: normalizeState(c.state),
    tags: parseTags(c.tags),
  }
}

export function mapCustomerWithAddress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c: any,
  defaultCurrency: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentOrders: any[] = []
): MappedShopifyCustomerWithAddress {
  const base = mapCustomer(c, defaultCurrency)
  const addr = c.default_address
  return {
    ...base,
    defaultAddress: addr
      ? {
          address1: addr.address1 ?? null,
          city: addr.city ?? null,
          country: addr.country ?? null,
          zip: addr.zip ?? null,
        }
      : null,
    recentOrderIds: recentOrders.slice(0, 5).map((o) => orderGid(o.id)),
  }
}

function normalizeState(s: unknown): MappedShopifyCustomer['state'] {
  if (s === 'disabled' || s === 'invited' || s === 'enabled' || s === 'declined') return s
  return 'enabled'
}

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean)
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}
