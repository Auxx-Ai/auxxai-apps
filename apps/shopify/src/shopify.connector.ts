// src/shopify.connector.ts
//
// The single Shopify data connector. One connector per app, MANY streams — the
// platform supports multiple streams per connector but resolves one connector per
// app slug, so everything Shopify syncs hangs off this one declaration:
//   • `customer` → contributing system `contact` (merge on email).
//   • `order`    → OWNED MULTI-LEVEL fan-out: order root → owned `shopify_orders`,
//                  embedded customer → contributing `contact`, line_items[] → owned
//                  `shopify_line_items` (has_many child), line_items[].product_id →
//                  reference to the owned `shopify_products` def.
//   • `product`  → populates the owned `shopify_products` def the order stream's
//                  line→product reference links to (one connector owns it, so the
//                  cross-stream `ownedApiSlug: 'shopify_products'` targetRef resolves
//                  in materialization pass-1).
//
// The `relationship` decl on each owned edge drives the platform to AUTO-CREATE the
// relationship field (+ inverse) at materialization, so a line item actually attaches
// to its order at sync time. Keep `relationshipFieldKey === relationship.fieldKey` so
// the fan-out resolves the provisioned field by the same key.

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import { z } from '@auxx/sdk/tools'
import shopifySync from './shopify.connector.server'

export const shopifyConnector = defineDataConnector({
  id: 'shopify',
  label: 'Shopify',
  requiresConnection: true,
  iconKey: 'shopping-bag',
  // No toggles for v1 — still required by defineDataConnector.
  config: z.object({}),
  streams: [
    // ── customer ────────────────────────────────────────────────────────────────
    // Storefront customers → system `contact` (contributing, merge on email).
    // External id = Shopify customer id; `email` is the secondary identity-match key
    // so an imported customer merges into an existing contact on first link.
    {
      key: 'customer',
      // Guests/phone-only customers have no name → email is the safe display.
      displayFieldKey: 'email',
      fields: {
        id: { type: 'TEXT', name: 'Shopify Customer ID', sourcePath: 'id' },
        email: { type: 'EMAIL', name: 'Email', sourcePath: 'email', pii: true },
        firstName: { type: 'TEXT', name: 'First Name', sourcePath: 'first_name', pii: true },
        lastName: { type: 'TEXT', name: 'Last Name', sourcePath: 'last_name', pii: true },
        phone: { type: 'TEXT', name: 'Phone', sourcePath: 'phone', pii: true },
        ordersCount: { type: 'NUMBER', name: 'Orders', sourcePath: 'orders_count' },
        totalSpent: { type: 'CURRENCY', name: 'Total Spent', sourcePath: 'total_spent' },
        createdAt: { type: 'DATETIME', name: 'Shopify Created', sourcePath: 'created_at' },
      },
      // Contributing into the SYSTEM contact def — merge on email, Shopify customer
      // id stays the primary (external) key. `fieldBindings` pre-map the value fields
      // (first/last/phone) onto the contact's matching attributes so the user doesn't
      // hand-map them in the Map step. The Shopify customer id is never bound here —
      // it rides ConnectorRecord.externalId.
      defaultMappings: [
        {
          rootPath: '',
          target: {
            mode: 'contributing',
            entityKind: 'contact',
            matchFieldKeys: ['email'],
            fieldBindings: [
              { sourceFieldKey: 'firstName', targetKey: 'first_name' },
              { sourceFieldKey: 'lastName', targetKey: 'last_name' },
              { sourceFieldKey: 'phone', targetKey: 'phone' },
            ],
          },
        },
      ],
      exampleRecord: {
        id: 'gid://shopify/Customer/207119551',
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '+15555550123',
        orders_count: 4,
        total_spent: '210.00',
        created_at: '2024-02-11T10:00:00Z',
      },
    },

    // ── order ─────────────────────────────────────────────────────────────────────
    // REST /orders.json (line items embedded), fans out into shopify_orders +
    // shopify_line_items + the contact/product edges.
    {
      key: 'order',
      displayFieldKey: 'name',
      // SOURCE schema (Layer A) — one fetched order, incl. embedded customer +
      // line_items[]. The platform partitions these across the owned defs by rootPath:
      // root fields → order, `line_items[].*` → line item, `customer.*` → the
      // contributing contact branch.
      fields: {
        id: { type: 'TEXT', name: 'Order ID', sourcePath: 'id' },
        name: { type: 'TEXT', name: 'Order Name', sourcePath: 'name' },
        totalPrice: { type: 'CURRENCY', name: 'Total', sourcePath: 'total_price' },
        financialStatus: {
          type: 'TEXT',
          name: 'Financial Status',
          sourcePath: 'financial_status',
        },
        fulfillmentStatus: {
          type: 'TEXT',
          name: 'Fulfillment Status',
          sourcePath: 'fulfillment_status',
        },
        createdAt: { type: 'DATETIME', name: 'Shopify Created', sourcePath: 'created_at' },
        // Embedded customer — bound by the contributing `customer` mapping, not the order def.
        'customer.email': {
          type: 'EMAIL',
          name: 'Customer Email',
          sourcePath: 'customer.email',
          pii: true,
        },
        'customer.firstName': {
          type: 'TEXT',
          name: 'Customer First',
          sourcePath: 'customer.first_name',
          pii: true,
        },
        'customer.lastName': {
          type: 'TEXT',
          name: 'Customer Last',
          sourcePath: 'customer.last_name',
          pii: true,
        },
        // Line items — fanned out per element into the owned shopify_line_items def.
        'lineItems.title': { type: 'TEXT', name: 'Line Title', sourcePath: 'line_items[].title' },
        'lineItems.sku': { type: 'TEXT', name: 'Line SKU', sourcePath: 'line_items[].sku' },
        'lineItems.quantity': {
          type: 'NUMBER',
          name: 'Line Qty',
          sourcePath: 'line_items[].quantity',
        },
        'lineItems.price': {
          type: 'CURRENCY',
          name: 'Line Price',
          sourcePath: 'line_items[].price',
        },
        // id-only ref → the reference mapping stamps the product edge; never a column.
        'lineItems.productId': {
          type: 'TEXT',
          name: 'Line Product ID',
          sourcePath: 'line_items[].product_id',
        },
      },
      // Recommended fan-out. The user confirms/overrides at setup; the `relationship`
      // decls are what make the edges actually provision + form.
      defaultMappings: [
        // Root order → owned shopify_orders.
        {
          rootPath: '',
          target: {
            mode: 'owned',
            entity: {
              apiSlug: 'shopify_orders',
              singular: 'Shopify Order',
              plural: 'Shopify Orders',
              primaryDisplayField: 'name',
            },
          },
        },

        // Embedded customer → contributing contact, merge on email (external id stays
        // the Shopify customer id; no owned edge to provision).
        {
          rootPath: 'customer',
          relationshipFieldKey: 'customer',
          target: {
            mode: 'contributing',
            entityKind: 'contact',
            matchFieldKeys: ['email'],
          },
        },

        // line_items[] → owned shopify_line_items, has_many child of the order. The
        // platform provisions the `Line Items` edge on the order def + the `Order`
        // belongs_to inverse on the line-item def.
        {
          rootPath: 'line_items[]',
          relationshipFieldKey: 'lineItems',
          relationship: {
            fieldKey: 'lineItems',
            name: 'Line Items',
            cardinality: 'has_many',
            inverseName: 'Order',
            // no targetRef → owned child (this mapping's own shopify_line_items def)
          },
          target: {
            mode: 'owned',
            entity: {
              apiSlug: 'shopify_line_items',
              singular: 'Line Item',
              plural: 'Line Items',
            },
          },
        },

        // line_items[].product_id → reference to owned shopify_products. The id links
        // each line item to the product the `product` stream (below) populates; the
        // reference itself writes no item, just stamps the edge.
        {
          rootPath: 'line_items[].product_id',
          linkMode: 'reference',
          relationshipFieldKey: 'product',
          relationship: {
            fieldKey: 'product',
            name: 'Product',
            cardinality: 'belongs_to',
            inverseName: 'Line Items',
            targetRef: { ownedApiSlug: 'shopify_products' },
          },
          target: {
            mode: 'owned',
            entity: {
              apiSlug: 'shopify_products',
              singular: 'Shopify Product',
              plural: 'Shopify Products',
            },
          },
        },
      ],
      // Backfill once, then run deltas off the `updated_at` watermark.
      syncMode: 'incremental',
      exampleRecord: {
        id: '1234567890',
        name: '#1001',
        total_price: '49.99',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        created_at: '2024-02-11T10:00:00Z',
        customer: { email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' },
        line_items: [
          {
            title: 'Red T-Shirt',
            sku: 'TSHIRT-RED-M',
            quantity: 2,
            price: '19.99',
            product_id: '987654321',
          },
        ],
      },
    },

    // ── product ─────────────────────────────────────────────────────────────────
    // Product catalog — populates the owned shopify_products def the order stream's
    // line→product reference links to. `externalId` (the numeric product id) matches
    // the order stream's `line_items[].product_id` so the edge resolves. Flat product
    // metadata only; variant-level price/sku is follow-up (it lands on line items).
    {
      key: 'product',
      displayFieldKey: 'title',
      fields: {
        id: { type: 'TEXT', name: 'Product ID', sourcePath: 'id' },
        title: { type: 'TEXT', name: 'Title', sourcePath: 'title' },
        vendor: { type: 'TEXT', name: 'Vendor', sourcePath: 'vendor' },
        productType: { type: 'TEXT', name: 'Product Type', sourcePath: 'product_type' },
        handle: { type: 'TEXT', name: 'Handle', sourcePath: 'handle' },
        status: { type: 'TEXT', name: 'Status', sourcePath: 'status' },
        tags: { type: 'TEXT', name: 'Tags', sourcePath: 'tags' },
        createdAt: { type: 'DATETIME', name: 'Shopify Created', sourcePath: 'created_at' },
      },
      // Owned shopify_products — same apiSlug the order stream's reference targets, so
      // both resolve to one def (the connector owns it; no ownership conflict).
      defaultMappings: [
        {
          rootPath: '',
          target: {
            mode: 'owned',
            entity: {
              apiSlug: 'shopify_products',
              singular: 'Shopify Product',
              plural: 'Shopify Products',
              primaryDisplayField: 'title',
            },
          },
        },
      ],
      syncMode: 'incremental',
      exampleRecord: {
        id: '987654321',
        title: 'Red T-Shirt',
        vendor: 'Acme',
        product_type: 'Apparel',
        handle: 'red-t-shirt',
        status: 'active',
        tags: 'summer, cotton',
        created_at: '2024-01-05T08:00:00Z',
      },
    },
  ],
  execute: shopifySync,
})
