// src/blocks/shopify/resources/scope-grants.ts
//
// What this connection's token can actually do, derived from the scopes Shopify GRANTED it
// rather than from a build-time constant. Replaces the old `TEMP_RESTRICTIONS` block, which
// answered a per-connection question with one boolean shared by every org.
//
// See auxxai repo: plans/connections/scope-derived-capabilities.md

/**
 * Provider scope → the capability names holding it confers.
 *
 * Declared in this direction on purpose. Shopify auto-includes `read_x` wherever `write_x`
 * was requested, so `write_orders` granting BOTH capabilities is a fact about that scope —
 * not a prefix rule the checker has to apply to scope strings. Two consequences fall out:
 *
 *  - **"Either of these will do" needs no mechanism.** The merchant-managed and assigned
 *    fulfillment scopes both grant `fulfillment:read`; two rows granting the same capability
 *    IS the or-condition.
 *  - **Scopes that are not a read/write level still fit.** `read_all_orders` grants
 *    `orders:history-full`, which changes what an existing read returns rather than
 *    switching an operation on.
 */
export const SCOPE_GRANTS = {
  read_orders: ['orders:read'],
  write_orders: ['orders:read', 'orders:write'],
  read_all_orders: ['orders:history-full'],

  read_products: ['products:read'],
  write_products: ['products:read', 'products:write'],

  read_customers: ['customers:read'],
  write_customers: ['customers:read', 'customers:write'],

  read_inventory: ['inventory:read'],
  write_inventory: ['inventory:read', 'inventory:write'],

  read_draft_orders: ['draftOrders:read'],
  write_draft_orders: ['draftOrders:read', 'draftOrders:write'],

  read_locations: ['locations:read'],

  read_merchant_managed_fulfillment_orders: ['fulfillment:read'],
  write_merchant_managed_fulfillment_orders: ['fulfillment:read', 'fulfillment:write'],
  read_assigned_fulfillment_orders: ['fulfillment:read'],
  write_assigned_fulfillment_orders: ['fulfillment:read', 'fulfillment:write'],

  // ⚠️ UNVERIFIED. The connector calls REST `/price_rules*`; Shopify documents both
  // `read_discounts`/`write_discounts` and `read_price_rules`/`write_price_rules`, and which
  // governs that endpoint is not confirmed. Every other row above is derivable without docs.
  read_price_rules: ['discounts:read'],
  write_price_rules: ['discounts:read', 'discounts:write'],
} as const satisfies Record<string, readonly string[]>

/**
 * The capabilities each resource's reads and writes require.
 *
 * `'owner-derived'` means the requirement cannot be known statically. Metafields inherit the
 * OWNER resource's scope and the owner is chosen at runtime, so a product-owned write
 * succeeds while a shop-level one may 403 under identical config. Left ungated deliberately
 * (as it was under `TEMP_RESTRICTIONS`); the 403 surfaces as InsufficientPermissionsError.
 */
export const RESOURCE_CAPABILITIES = {
  order: { read: ['orders:read'], write: ['orders:write'] },
  product: { read: ['products:read'], write: ['products:write'] },
  variant: { read: ['products:read'], write: ['products:write'] },
  collection: { read: ['products:read'], write: ['products:write'] },
  customer: { read: ['customers:read'], write: ['customers:write'] },
  customerAddress: { read: ['customers:read'], write: ['customers:write'] },
  inventoryItem: { read: ['inventory:read'], write: ['inventory:write'] },
  inventoryLevel: { read: ['inventory:read'], write: ['inventory:write'] },
  draftOrder: { read: ['draftOrders:read'], write: ['draftOrders:write'] },
  fulfillment: { read: ['fulfillment:read'], write: ['fulfillment:write'] },
  discount: { read: ['discounts:read'], write: ['discounts:write'] },
  metafield: 'owner-derived',
} as const

/**
 * Operations that mutate. Everything else — `get`, `getMany`, `search` — is a read.
 * A declared set, not a naming convention: a new operation must be classified here or it is
 * treated as a read, which is the safe-to-notice direction (it will 403 rather than hide).
 */
export const WRITE_OPS: ReadonlySet<string> = new Set([
  'create',
  'update',
  'delete',
  'set',
  'adjust',
  'connect',
  'setDefault',
  'cancel',
  'complete',
  'sendInvoice',
  'addProduct',
  'removeProduct',
])

/**
 * Per-`resource.operation` overrides for requirements that are not the resource default.
 * Empty today — no operation is confirmed to need more than its resource's scope. Declare
 * MINIMALLY: over-declaring hides operations that work, which is the failure this whole
 * mechanism exists to remove.
 */
export const OPERATION_CAPABILITY_OVERRIDES: Record<string, readonly string[]> = {}

/**
 * Scopes assumed when a connection carries no `metadata.scope` at all.
 *
 * Only rows minted outside the OAuth callback can hit this — `persist-shopify-token.ts` and
 * anything predating the platform storing the granted scope. Mirrors `shopify.app.toml`, so
 * such connections behave exactly as they did before this mechanism existed.
 *
 * Deliberately a temporary crutch, not a contract. Every write site should stamp the real
 * grant instead.
 */
export const ASSUMED_SCOPES_WHEN_UNKNOWN: readonly string[] = [
  'read_orders',
  'write_orders',
  'read_products',
  'write_products',
  'read_locations',
  'read_customers',
  'read_draft_orders',
  'read_inventory',
  'read_merchant_managed_fulfillment_orders',
  'read_assigned_fulfillment_orders',
]
