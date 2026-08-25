// src/blocks/shopify/resources/constants.ts

const RESOURCES_ALL = [
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

const OPERATIONS_ALL = {
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
// TEMP: scope restrictions
//
// The Shopify app's granted scopes are
//   read_orders, write_orders, read_products, write_products, read_locations,
//   read_customers, read_draft_orders, read_inventory,
//   read_merchant_managed_fulfillment_orders, read_assigned_fulfillment_orders
//
// Several block operations call endpoints those scopes cannot reach. They do not
// fail gracefully — Shopify answers 403 `api_client does not have the required
// permission(s)` (confirmed for fulfillment create) — so a tester picking one gets
// an opaque error rather than a missing option. Hide them at the source until the
// scope list is corrected, which needs a new app version + Shopify re-review.
//
// 🛑 TO RE-ENABLE: set TEMP_RESTRICTIONS to false. Nothing else. The lists below
// are the complete record of what was withheld and why, so deleting this block
// (and the two filters) restores the app exactly.
//
// See auxxai repo: plans/connections/byo-oauth-client-runtime-gap.md Part 2 F11.
// ─────────────────────────────────────────────────────────────────────────────

export const TEMP_RESTRICTIONS = true

/** Resources with no granting scope at all — neither read nor write. */
const RESTRICTED_RESOURCES: readonly string[] = [
  // price_rules / discount_codes appear in no scope the app requests.
  'discount',
]

/** Per-resource operations whose write scope is missing (reads stay available). */
const RESTRICTED_OPERATIONS: Record<string, readonly string[]> = {
  // needs write_customers
  customer: ['create', 'update', 'delete'],
  customerAddress: ['create', 'update', 'delete', 'setDefault'],
  // needs write_draft_orders (only read_draft_orders is granted)
  draftOrder: ['create', 'update', 'delete', 'complete', 'sendInvoice'],
  // needs write_inventory (only read_inventory is granted)
  inventoryItem: ['update'],
  inventoryLevel: ['set', 'adjust', 'connect', 'delete'],
  // only the READ fulfillment-order scopes are granted; POST /fulfillments.json
  // returns "api_client does not have the required permission(s)".
  fulfillment: ['create', 'update', 'cancel'],
  // NOTE: `metafield` is deliberately NOT restricted. Metafields inherit the owner
  // resource's scope, so product/order-owned writes work; a customer-owned or
  // shop-level write may still 403. Left enabled rather than removing a resource
  // that is mostly functional.
}

const isRestrictedResource = (resource: string) =>
  TEMP_RESTRICTIONS && RESTRICTED_RESOURCES.includes(resource)

const isRestrictedOperation = (resource: string, operation: string) =>
  TEMP_RESTRICTIONS && (RESTRICTED_OPERATIONS[resource]?.includes(operation) ?? false)

/** Resource picker options, minus any fully-restricted resource. */
export const RESOURCES = RESOURCES_ALL.filter((r) => !isRestrictedResource(r.value))

/**
 * Operation options per resource. Both the panel (which renders one row per key)
 * and `VALID_OPERATIONS` below derive from this, so the picker and the server-side
 * guard can never disagree about what is allowed.
 */
export const OPERATIONS = Object.fromEntries(
  Object.entries(OPERATIONS_ALL)
    .filter(([resource]) => !isRestrictedResource(resource))
    .map(([resource, ops]) => [
      resource,
      ops.filter((op) => !isRestrictedOperation(resource, op.value)),
    ])
) as Record<string, { value: string; label: string }[]>

/** The flat union the block schema advertises — drop any op no resource still offers. */
const survivingOperations = new Set(
  Object.values(OPERATIONS).flatMap((ops) => ops.map((op) => op.value))
)
export const ALL_OPERATIONS = ALL_OPERATIONS_ALL.filter((op) => survivingOperations.has(op.value))

/** Server-side guard for `shopifyExecute`. Derived — never hand-maintained. */
export const VALID_OPERATIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(OPERATIONS).map(([resource, ops]) => [resource, ops.map((op) => op.value)])
)
