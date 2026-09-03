// src/fields.ts

import { defineFields } from '@auxx/sdk/fields'

/**
 * Custom fields the Shopify app owns — one set per connected store
 * (`scope: 'connection'`). Provisioned on `connection-added`, removed on
 * `connection-removed` / uninstall.
 *
 * Contact fields:
 * - `customerId` — the chat-safe order **fence key**: a verified storefront
 *   customer's Shopify customer id, written platform-side from the
 *   App-Proxy-signed JWT at passport mint (never from visitor input). The
 *   order tools scope lookups to this id and ignore any visitor-supplied
 *   id/email. Hidden; a bare customer id is only unique within a shop, which
 *   the per-connection scope preserves.
 * - `storeDomain` — CRM-only: lets contacts be filtered/segmented by store
 *   domain. Visible + filterable; **never** read by the order fence.
 *
 * Part / product fields (contribute-mode product stream — provenance columns
 * on native records, per the D8 ownership rule: a system field is a fact that
 * exists without Shopify, everything else lives here and goes away with the
 * connection):
 * - `variantId` — the variant's primary identity per store; the sink resolves
 *   a part by this on every sync after the first.
 * - `externalQuantity` — Shopify's inventory count, kept for drift comparison
 *   against the movement-ledger-owned `part_quantity_on_hand` (never written
 *   into it).
 * - `price` — the raw storefront price. PROVENANCE ONLY: the working sell
 *   price is `catalog_item_default_unit_price` under the follow model.
 * - `productId` — the product's primary identity per store (1:1).
 *
 * Order / line-item fields (money plan `plans/money/tasks/37-shopify-native-retarget.md`
 * §6/§7.3 — the order and line-item streams retarget onto the native `order` and
 * `line_item` entities in contribute mode; these are what is left over: provenance,
 * the fulfillment rollup, and the parts of the order the projection does not model.
 * Every field here is `creatable: false, updatable: false` — the sink's `sync`
 * session is the only writer. All hidden except `orderName`.
 *
 * - `shopifyOrderId` / `shopifyLineId` — external identity, mirrored to
 *   `RecordIdentity`.
 * - `orderName` — Shopify's `#1001`, the string the merchant actually sees.
 *   The order stream also binds it onto `order_number` (money plan 39 §6.5:
 *   the numbering hook keeps a supplied number and only allocates `ORD-000N`
 *   when nothing came in), so this field is redundant; it is kept as the one
 *   visible field in the table so a synced order's Shopify name can be a grid
 *   column / filter / saved view.
 * - `firstFulfilledAt` / `lastFulfilledAt` / `shipmentCount` / `isSplitShipment`
 *   (order) and `fulfilledAt` / `lastFulfilledAt` / `fulfilledQuantity` /
 *   `shipmentCount` / `fulfillableQuantity` / `trackingNumber` (line_item) —
 *   the fulfillment rollup. Shopify's summary, not a fact at auxx's grain: a
 *   line that ships twice has two ship dates and one DATETIME column holds
 *   one, so these are convenience columns rather than the (fulfillment, line)
 *   grain a real fulfillment entity would carry (§5.2, out of scope here).
 * - `raw` — everything the order projection does not model: `refunds`,
 *   `tax_lines`, `shipping_lines`, `discount_applications` and
 *   `discount_allocations`. Every open accrual question on the sell side
 *   currently needs a resync to answer; with `raw` stored at ingest it needs
 *   a query.
 */
export const shopifyFields = defineFields([
  {
    key: 'customerId',
    type: 'TEXT',
    targetEntity: 'contact',
    scope: 'connection',
    name: 'Shopify customer ID',
    identity: true,
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'storeDomain',
    type: 'TEXT',
    targetEntity: 'contact',
    scope: 'connection',
    name: 'Shopify store',
    capabilities: {
      hidden: false,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'variantId',
    type: 'TEXT',
    targetEntity: 'part',
    scope: 'connection',
    name: 'Shopify variant ID',
    identity: true,
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'externalQuantity',
    type: 'NUMBER',
    targetEntity: 'part',
    scope: 'connection',
    name: 'Shopify inventory quantity',
    capabilities: {
      hidden: false,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  // Provenance only — the WORKING price is catalog_item_default_unit_price
  // (plans/products/02-shopify-mapping.md §5.1's follow model).
  {
    key: 'price',
    type: 'CURRENCY',
    targetEntity: 'part',
    scope: 'connection',
    name: 'Shopify price',
    capabilities: {
      hidden: false,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'productId',
    type: 'TEXT',
    targetEntity: 'product',
    scope: 'connection',
    name: 'Shopify product ID',
    identity: true,
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },

  // ── order (money plan 37 §7.3) ────────────────────────────────────────────
  {
    key: 'shopifyOrderId',
    type: 'TEXT',
    targetEntity: 'order',
    scope: 'connection',
    name: 'Shopify Order ID',
    identity: true,
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  // The only visible field in this table (§10.2). Redundant since the order
  // stream also fills `order_number` from the same `name` (money plan 39 §6.5),
  // kept so a synced order's Shopify name (`#1001`) stays a grid column, a
  // filter, a saved view.
  {
    key: 'orderName',
    type: 'TEXT',
    targetEntity: 'order',
    scope: 'connection',
    name: 'Shopify Order Name',
    capabilities: {
      hidden: false,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'firstFulfilledAt',
    type: 'DATETIME',
    targetEntity: 'order',
    scope: 'connection',
    name: 'First Fulfilled At',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'lastFulfilledAt',
    type: 'DATETIME',
    targetEntity: 'order',
    scope: 'connection',
    name: 'Last Fulfilled At',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'shipmentCount',
    type: 'NUMBER',
    targetEntity: 'order',
    scope: 'connection',
    name: 'Shipments',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'isSplitShipment',
    type: 'CHECKBOX',
    targetEntity: 'order',
    scope: 'connection',
    name: 'Split Shipment',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  // Everything the order projection does not model — see the file header.
  {
    key: 'raw',
    type: 'JSON',
    targetEntity: 'order',
    scope: 'connection',
    name: 'Shopify Raw Order',
    capabilities: {
      hidden: true,
      filterable: false,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },

  // ── line_item (money plan 37 §7.3) ────────────────────────────────────────
  {
    key: 'shopifyLineId',
    type: 'TEXT',
    targetEntity: 'line_item',
    scope: 'connection',
    name: 'Shopify Line ID',
    identity: true,
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'fulfilledAt',
    type: 'DATETIME',
    targetEntity: 'line_item',
    scope: 'connection',
    name: 'Line Fulfilled At',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'lastFulfilledAt',
    type: 'DATETIME',
    targetEntity: 'line_item',
    scope: 'connection',
    name: 'Line Last Fulfilled At',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'fulfilledQuantity',
    type: 'NUMBER',
    targetEntity: 'line_item',
    scope: 'connection',
    name: 'Line Fulfilled Qty',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  {
    key: 'shipmentCount',
    type: 'NUMBER',
    targetEntity: 'line_item',
    scope: 'connection',
    name: 'Line Shipments',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  // Real Shopify field — units still awaiting shipment. Makes the "paid but
  // unfulfilled at the cutoff" deferred-revenue figure exact rather than
  // inferred from the fulfillment status enum.
  {
    key: 'fulfillableQuantity',
    type: 'NUMBER',
    targetEntity: 'line_item',
    scope: 'connection',
    name: 'Line Fulfillable Qty',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: true,
      creatable: false,
      updatable: false,
    },
  },
  // Join key to the carrier invoice. Populated only when the line shipped
  // exactly once — with two shipments there is no single tracking number.
  {
    key: 'trackingNumber',
    type: 'TEXT',
    targetEntity: 'line_item',
    scope: 'connection',
    name: 'Line Tracking Number',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
])
