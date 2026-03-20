# Shopify App — Workflow Node Examples

Each JSON file in this folder contains correct example node `data` objects for every operation on a given resource. Use these when building workflow templates.

## Files

| File | Resource | Operations |
|------|----------|-----------|
| `customer.json` | Customer | create, get, search, getMany, update, delete |
| `order.json` | Order | create, get, getMany, update, delete |
| `product.json` | Product | create, get, getMany, update, delete |
| `variant.json` | Product Variant | create, get, getMany, update, delete |
| `metafield.json` | Metafield | create, get, getMany, update, delete |
| `fulfillment.json` | Fulfillment | create, update (tracking), get, getMany, cancel |
| `draft-order.json` | Draft Order | create, get, getMany, update, delete, complete, sendInvoice |
| `inventory-level.json` | Inventory Level | getMany, set, adjust, connect, delete |

## Node Structure

Every Shopify workflow node always has:

```json
{
  "type": "@shopify:shopify",
  "appSlug": "shopify",
  "blockId": "shopify",
  "resource": "<resourceName>",
  "operation": "<operationName>"
}
```

## Field Naming Convention

Input fields use a **`<operation><FieldName>`** prefix pattern:

- `create` → `createEmail`, `createFirstName`, `createLineItems`, …
- `update` → `updateCustomerId`, `updateEmail`, …
- `get` → `getCustomerId`, `getFields`, …
- `getMany` → `getManyLimit`, `getManyCreatedAtMin`, …
- `delete` → `deleteCustomerId`, …
- `search` → `searchQuery`, `searchLimit`

Some resources have **shared fields** (used across all operations) that have no prefix:

| Resource | Shared fields |
|----------|--------------|
| `variant` | `productId` |
| `fulfillment` | `orderId` |
| `metafield` | `ownerResource`, `ownerId` |

**Product** has an irregular naming pattern — get uses `getProductId`/`getProductFields` and getMany uses `getProductMany*` (not `getMany*`).

## fieldModes

`fieldModes` controls whether a field is treated as a literal or resolves `{{...}}` variables.

Source truth: `isVariableMode = fieldModes[field] !== true`

- **`true`** — constant/literal mode. Value is used as-is (e.g., `"fulfilled"`, `"50"`)
- **`false` or absent** — variable mode. `{{nodeId.field}}` references are resolved

Rule of thumb:
- Fields containing `{{...}}` → omit from `fieldModes` (or set `false`) so they resolve correctly
- Static hardcoded strings (labels, enum values, literals) → set `true` to be explicit
- Boolean and numeric literals don't need entries; they are never `{{...}}` strings

## Critical: customer.get vs customer.search

`customer.get` requires a **numeric Shopify customer ID** (`getCustomerId`). It does **not** accept an email address.

To look up a customer by email, use `customer.search`:

```json
{
  "resource": "customer",
  "operation": "search",
  "searchQuery": "email:{{extractor-001.extracted_data.email}}",
  "searchLimit": "10",
  "fieldModes": { "searchLimit": true }
}
```

Other search query patterns: `first_name:John`, `last_name:Doe`, `phone:+1555...`, `tag:vip`

## Output Reference Paths

| Resource | Output path example |
|----------|-------------------|
| customer (get/create/update) | `{{nodeId.customer.email}}` |
| customer (search/getMany) | `{{nodeId.customers[0].customerId}}` |
| order (get/create/update) | `{{nodeId.order.orderId}}` |
| product (get/create/update) | `{{nodeId.product.productId}}` |
| variant | `{{nodeId.variant.inventoryItemId}}` |
| metafield | `{{nodeId.metafield.value}}` |
| fulfillment | `{{nodeId.fulfillment.trackingNumber}}` |
| draftOrder | `{{nodeId.draftOrder.invoiceUrl}}` |
| inventoryLevel | `{{nodeId.inventoryLevel.available}}` |
| delete operations | `{{nodeId.success}}` |

## Currency Fields

Currency values are stored in **cents** (integer). Examples:

- `$19.99` → `1999`
- `$100.00` → `10000`

This applies to: `price`, `compareAtPrice`, `totalPrice`, `subtotalPrice`, `totalSpent`.
