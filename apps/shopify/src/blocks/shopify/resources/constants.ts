// src/blocks/shopify/resources/constants.ts

export const RESOURCES_ALL = [
  { value: 'order', label: 'Order' },
  { value: 'product', label: 'Product' },
  { value: 'customer', label: 'Customer' },
  { value: 'customerAddress', label: 'Customer Address' },
  { value: 'variant', label: 'Product Variant' },
  { value: 'inventoryItem', label: 'Inventory Item' },
  { value: 'inventoryLevel', label: 'Inventory Level' },
  { value: 'metafield', label: 'Metafield' },
  { value: 'fulfillment', label: 'Fulfillment' },
  { value: 'draftOrder', label: 'Draft Order' },
  { value: 'collection', label: 'Collection' },
  { value: 'discount', label: 'Discount Code' },
] as const

export const OPERATIONS_ALL = {
  order: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  product: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  customer: [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'delete', label: 'Delete' },
    { value: 'search', label: 'Search' },
  ],
  customerAddress: [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'delete', label: 'Delete' },
    { value: 'setDefault', label: 'Set Default' },
  ],
  variant: [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'delete', label: 'Delete' },
  ],
  inventoryItem: [
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  inventoryLevel: [
    { value: 'getMany', label: 'Get Many' },
    { value: 'set', label: 'Set' },
    { value: 'adjust', label: 'Adjust' },
    { value: 'connect', label: 'Connect' },
    { value: 'delete', label: 'Delete' },
  ],
  metafield: [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'delete', label: 'Delete' },
  ],
  fulfillment: [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update Tracking' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'cancel', label: 'Cancel' },
  ],
  draftOrder: [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'delete', label: 'Delete' },
    { value: 'complete', label: 'Complete' },
    { value: 'sendInvoice', label: 'Send Invoice' },
  ],
  collection: [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'delete', label: 'Delete' },
    { value: 'addProduct', label: 'Add Product' },
    { value: 'removeProduct', label: 'Remove Product' },
  ],
  discount: [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'delete', label: 'Delete' },
  ],
} as const

const ALL_OPERATIONS_ALL = [
  { value: 'create', label: 'Create' },
  { value: 'delete', label: 'Delete' },
  { value: 'get', label: 'Get' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'update', label: 'Update' },
  { value: 'search', label: 'Search' },
  { value: 'setDefault', label: 'Set Default' },
  { value: 'set', label: 'Set' },
  { value: 'adjust', label: 'Adjust' },
  { value: 'connect', label: 'Connect' },
  { value: 'cancel', label: 'Cancel' },
  { value: 'complete', label: 'Complete' },
  { value: 'sendInvoice', label: 'Send Invoice' },
  { value: 'addProduct', label: 'Add Product' },
  { value: 'removeProduct', label: 'Remove Product' },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// The block schema advertises the app's FULL surface. What a given merchant may
// actually use is decided per connection, from the scopes Shopify granted that
// connection's token — see `capabilities.ts` / `scope-grants.ts`.
//
// This replaced a `TEMP_RESTRICTIONS` boolean that hid 1 resource and 21 operations
// from every org at once, whether or not their token could perform them.
//
// 🛑 The schema being open is why `shopify.server.ts` must check capabilities too: the
// catalog and `shopifyToolMap` are reachable by Kopilot without the panel ever rendering.
//
// See auxxai repo: plans/connections/scope-derived-capabilities.md
// ─────────────────────────────────────────────────────────────────────────────

/** Resource picker options (full surface; narrowed per connection by the panel). */
export const RESOURCES = RESOURCES_ALL

/** Operation options per resource (full surface; narrowed per connection by the panel). */
export const OPERATIONS = OPERATIONS_ALL as unknown as Record<
  string,
  { value: string; label: string }[]
>

/** The flat union the block schema advertises — the app's whole surface. */
export const ALL_OPERATIONS = ALL_OPERATIONS_ALL

/**
 * Structural validity: does this `resource.operation` pair exist at all? Derived — never
 * hand-maintained. Says nothing about whether the connection is PERMITTED to run it; that is
 * `capabilities.ts`, and `shopifyExecute` checks both.
 */
export const VALID_OPERATIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(OPERATIONS).map(([resource, ops]) => [resource, ops.map((op) => op.value)])
)
