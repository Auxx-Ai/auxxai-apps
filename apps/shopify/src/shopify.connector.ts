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
//                  cross-stream `ownedKey: 'products'` targetRef resolves to the same
//                  owned def both streams declare under `key: 'products'`).
//
// The `relationship` decl on each owned edge drives the platform to AUTO-CREATE the
// relationship field (+ inverse) at materialization, so a line item actually attaches
// to its order at sync time. Keep `relationshipFieldKey === relationship.fieldKey` so
// the fan-out resolves the provisioned field by the same key.

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import { z } from '@auxx/sdk/tools'
import shopifySync from './shopify.connector.server'

// ── Shopify enum option sets ──────────────────────────────────────────────────
// Declared as predefined SINGLE_SELECT options so a synced status lands as a real
// (colored, filterable) enum chip instead of raw text. These mirror Shopify's REST
// Admin API value sets EXACTLY — an incoming value outside the list is rejected at
// sink, so the server projection must only ever emit these canonical values.

/** order.financial_status — payment lifecycle. */
const FINANCIAL_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'authorized', label: 'Authorized', color: 'blue' },
  { value: 'partially_paid', label: 'Partially Paid', color: 'amber' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'partially_refunded', label: 'Partially Refunded', color: 'orange' },
  { value: 'refunded', label: 'Refunded', color: 'gray' },
  { value: 'voided', label: 'Voided', color: 'red' },
]

/**
 * order / line-item fulfillment_status — Shopify returns `null` for an unfulfilled
 * order; the server projects that null to `'unfulfilled'` so the chip is meaningful.
 */
const FULFILLMENT_STATUS_OPTIONS = [
  { value: 'unfulfilled', label: 'Unfulfilled', color: 'gray' },
  { value: 'partial', label: 'Partially Fulfilled', color: 'amber' },
  { value: 'fulfilled', label: 'Fulfilled', color: 'green' },
  { value: 'restocked', label: 'Restocked', color: 'gray' },
]

/** order.cancel_reason — only set on a cancelled order (else null). */
const CANCEL_REASON_OPTIONS = [
  { value: 'customer', label: 'Customer', color: 'gray' },
  { value: 'fraud', label: 'Fraud', color: 'red' },
  { value: 'inventory', label: 'Inventory', color: 'amber' },
  { value: 'declined', label: 'Declined', color: 'orange' },
  { value: 'staff', label: 'Staff', color: 'blue' },
  { value: 'other', label: 'Other', color: 'gray' },
]

/** product.status — catalog publication state. */
const PRODUCT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'gray' },
  { value: 'draft', label: 'Draft', color: 'amber' },
]

/** Full address sub-field set surfaced on ADDRESS_STRUCT order address fields. */
const ADDRESS_COMPONENTS = ['street1', 'street2', 'city', 'state', 'zipCode', 'country']

export const shopifyConnector = defineDataConnector({
  id: 'shopify',
  label: 'Shopify',
  description:
    'Sync orders, products, and customers from your Shopify store into your CRM — kept up to date automatically.',
  requiresConnection: true,
  iconKey: 'shopping-bag',
  // Connector-level webhook SIGNAL: deliveries from the app's single Shopify trigger
  // drive webhook-sync for this connector (one signal per connector; the app
  // multiplexes all topics through this one triggerId — per-stream
  // `webhookTrigger.filter` discriminates on `triggerData.topic`).
  webhookTrigger: { triggerId: 'shopify.shopify-trigger' },
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
        // Default-address scalars — bound onto the contact's existing city/region/
        // country TEXT fields (contact has no ADDRESS_STRUCT, so these stay flat). The
        // server flattens `default_address.*` onto these source paths.
        addressCity: { type: 'TEXT', name: 'City', sourcePath: 'default_address.city', pii: true },
        addressProvince: {
          type: 'TEXT',
          name: 'State / Province',
          sourcePath: 'default_address.province',
          pii: true,
        },
        addressCountry: {
          type: 'TEXT',
          name: 'Country',
          sourcePath: 'default_address.country',
          pii: true,
        },
        note: { type: 'TEXT', name: 'Note', sourcePath: 'note' },
      },
      // Contributing into the SYSTEM contact def — merge on email, Shopify customer
      // id stays the primary (external) key AND fills the identity: true `customerId`
      // app field (fields.ts) via `targetAppField`, so the record hub mirrors it into
      // RecordIdentity too. `connectionAppFields` fills the plain `storeDomain`
      // attribute from the bound connection's metadata (not the payload).
      // `fieldBindings` pre-map the remaining value fields (first/last/phone) onto
      // the contact's matching attributes so the user doesn't hand-map them.
      defaultMappings: [
        {
          rootPath: '',
          target: {
            mode: 'contributing',
            entityKind: 'contact',
            matchFieldKeys: ['email'],
            fieldBindings: [
              { sourceFieldKey: 'id', targetAppField: 'customerId' },
              { sourceFieldKey: 'firstName', targetKey: 'first_name' },
              { sourceFieldKey: 'lastName', targetKey: 'last_name' },
              { sourceFieldKey: 'phone', targetKey: 'phone' },
              { sourceFieldKey: 'addressCity', targetKey: 'city' },
              { sourceFieldKey: 'addressProvince', targetKey: 'region' },
              { sourceFieldKey: 'addressCountry', targetKey: 'country' },
              { sourceFieldKey: 'note', targetKey: 'notes' },
            ],
            connectionAppFields: [{ appFieldKey: 'storeDomain', from: 'label' }],
          },
        },
      ],
      exampleRecord: {
        id: '207119551',
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '+15555550123',
        orders_count: 4,
        total_spent: '210.00',
        created_at: '2024-02-11T10:00:00Z',
        note: 'VIP — repeat buyer',
        default_address: { city: 'Austin', province: 'Texas', country: 'United States' },
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
        // The declared External ID: a real "Shopify Order ID" column whose value the
        // platform marks as the record's dedupe/link key (equals ConnectorRecord
        // .externalId). Keyed `shopify_id` (not the bare `id` a def reserves).
        shopify_id: {
          type: 'TEXT',
          name: 'Shopify Order ID',
          sourcePath: 'id',
          isExternalId: true,
        },
        name: { type: 'TEXT', name: 'Order Name', sourcePath: 'name' },
        email: { type: 'EMAIL', name: 'Contact Email', sourcePath: 'email', pii: true },
        currency: { type: 'TEXT', name: 'Currency', sourcePath: 'currency' },
        totalPrice: { type: 'CURRENCY', name: 'Total', sourcePath: 'total_price' },
        subtotalPrice: { type: 'CURRENCY', name: 'Subtotal', sourcePath: 'subtotal_price' },
        totalTax: { type: 'CURRENCY', name: 'Total Tax', sourcePath: 'total_tax' },
        totalDiscounts: {
          type: 'CURRENCY',
          name: 'Total Discounts',
          sourcePath: 'total_discounts',
        },
        // Bounded Shopify enums → real SINGLE_SELECT chips (predefined option sets).
        financialStatus: {
          type: 'SINGLE_SELECT',
          name: 'Financial Status',
          sourcePath: 'financial_status',
          options: FINANCIAL_STATUS_OPTIONS,
        },
        fulfillmentStatus: {
          type: 'SINGLE_SELECT',
          name: 'Fulfillment Status',
          sourcePath: 'fulfillment_status',
          options: FULFILLMENT_STATUS_OPTIONS,
        },
        cancelReason: {
          type: 'SINGLE_SELECT',
          name: 'Cancel Reason',
          sourcePath: 'cancel_reason',
          options: CANCEL_REASON_OPTIONS,
        },
        tags: { type: 'TAGS', name: 'Tags', sourcePath: 'tags' },
        note: { type: 'TEXT', name: 'Note', sourcePath: 'note' },
        createdAt: { type: 'DATETIME', name: 'Shopify Created', sourcePath: 'created_at' },
        processedAt: { type: 'DATETIME', name: 'Processed At', sourcePath: 'processed_at' },
        cancelledAt: { type: 'DATETIME', name: 'Cancelled At', sourcePath: 'cancelled_at' },
        // Structured addresses → ADDRESS_STRUCT; the server shapes Shopify's address
        // object into { street1, street2, city, state, zipCode, country }.
        shippingAddress: {
          type: 'ADDRESS_STRUCT',
          name: 'Shipping Address',
          sourcePath: 'shipping_address',
          pii: true,
          addressComponents: ADDRESS_COMPONENTS,
        },
        billingAddress: {
          type: 'ADDRESS_STRUCT',
          name: 'Billing Address',
          sourcePath: 'billing_address',
          pii: true,
          addressComponents: ADDRESS_COMPONENTS,
        },
        // Embedded customer — bound by the contributing `customer` mapping, not the order def.
        // `customer.id` anchors the order→contact edge: it keys the contributing contact
        // item to the SAME external id the `customer` stream produces, so the relationship
        // two-pass resolves the order's `Customer` field to that contact.
        'customer.id': {
          type: 'TEXT',
          name: 'Customer ID',
          sourcePath: 'customer.id',
        },
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
        // The line-item's own Shopify id is its declared External ID — a stable per-line
        // identity that replaces the positional `{orderId}:{index}` fallback (survives
        // reorders/edits). The server must emit `id` on each projected line item.
        'lineItems.shopifyId': {
          type: 'TEXT',
          name: 'Shopify Line ID',
          sourcePath: 'line_items[].id',
          isExternalId: true,
        },
        'lineItems.title': { type: 'TEXT', name: 'Line Title', sourcePath: 'line_items[].title' },
        'lineItems.variantTitle': {
          type: 'TEXT',
          name: 'Line Variant',
          sourcePath: 'line_items[].variant_title',
        },
        'lineItems.sku': { type: 'TEXT', name: 'Line SKU', sourcePath: 'line_items[].sku' },
        'lineItems.vendor': {
          type: 'TEXT',
          name: 'Line Vendor',
          sourcePath: 'line_items[].vendor',
        },
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
        'lineItems.fulfillmentStatus': {
          type: 'SINGLE_SELECT',
          name: 'Line Fulfillment',
          sourcePath: 'line_items[].fulfillment_status',
          options: FULFILLMENT_STATUS_OPTIONS,
        },
        // id-only ref → the reference mapping stamps the product edge; never a column.
        'lineItems.productId': {
          type: 'TEXT',
          name: 'Line Product ID',
          sourcePath: 'line_items[].product_id',
        },
        // id-only ref → the reference mapping stamps the variant edge (matches the
        // `product` stream's variant External ID). Links a sold line to the exact
        // variant, so v9's inventory→part deduction can attribute the sale precisely.
        'lineItems.variantId': {
          type: 'TEXT',
          name: 'Line Variant ID',
          sourcePath: 'line_items[].variant_id',
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
              key: 'orders',
              apiSlug: 'shopify_orders',
              singular: 'Shopify Order',
              plural: 'Shopify Orders',
              primaryDisplayField: 'name',
            },
          },
        },

        // Embedded customer → contributing contact, merge on email. The `relationship`
        // decl provisions a `Customer` belongs_to edge on the owned order def → contact
        // (inverse `Orders` on the contact), so each order links to its customer. The
        // contact item is keyed by the embedded `customer.id` (see the `customer.id`
        // field above), matching the `customer` stream's external id so the edge resolves.
        // Also fills the same identity: true `customerId` app field + `storeDomain` the
        // `customer` stream does, so an order-only sync (no separate customer fetch) still
        // mirrors the contact's Shopify identity.
        {
          rootPath: 'customer',
          relationshipFieldKey: 'customer',
          relationship: {
            fieldKey: 'customer',
            name: 'Customer',
            cardinality: 'belongs_to', // order → one contact
            inverseName: 'Orders', // has_many `Orders` collection on the contact
            targetRef: { entityKind: 'contact' },
          },
          target: {
            mode: 'contributing',
            entityKind: 'contact',
            matchFieldKeys: ['email'],
            fieldBindings: [{ sourceFieldKey: 'customer.id', targetAppField: 'customerId' }],
            connectionAppFields: [{ appFieldKey: 'storeDomain', from: 'label' }],
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
              key: 'line_items',
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
            targetRef: { ownedKey: 'products' },
          },
          target: {
            mode: 'owned',
            entity: {
              key: 'products',
              apiSlug: 'shopify_products',
              singular: 'Shopify Product',
              plural: 'Shopify Products',
            },
          },
        },

        // line_items[].variant_id → reference to owned shopify_variants (populated by
        // the `product` stream's variants[] fan-out). Mirrors the product_id reference:
        // the id resolves against each variant's External ID and stamps a `Variant`
        // belongs_to edge on the line item (+ `Line Items` inverse on the variant),
        // writing no item itself.
        {
          rootPath: 'line_items[].variant_id',
          linkMode: 'reference',
          relationshipFieldKey: 'variant',
          relationship: {
            fieldKey: 'variant',
            name: 'Variant',
            cardinality: 'belongs_to',
            inverseName: 'Line Items',
            targetRef: { ownedKey: 'variants' },
          },
          target: {
            mode: 'owned',
            entity: {
              key: 'variants',
              apiSlug: 'shopify_variants',
              singular: 'Shopify Variant',
              plural: 'Shopify Variants',
            },
          },
        },
      ],
      // Backfill once, then run deltas off the `updated_at` watermark.
      syncMode: 'incremental',
      exampleRecord: {
        id: '1234567890',
        name: '#1001',
        email: 'jane@example.com',
        currency: 'USD',
        total_price: '49.99',
        subtotal_price: '45.99',
        total_tax: '4.00',
        total_discounts: '0.00',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        cancel_reason: null,
        tags: ['vip', 'gift'],
        note: 'Leave at front door',
        created_at: '2024-02-11T10:00:00Z',
        processed_at: '2024-02-11T10:01:00Z',
        cancelled_at: null,
        shipping_address: {
          street1: '123 Main St',
          street2: 'Apt 4',
          city: 'Austin',
          state: 'Texas',
          zipCode: '78701',
          country: 'United States',
        },
        billing_address: {
          street1: '123 Main St',
          street2: 'Apt 4',
          city: 'Austin',
          state: 'Texas',
          zipCode: '78701',
          country: 'United States',
        },
        customer: {
          id: '207119551',
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
        },
        line_items: [
          {
            id: '11223344',
            title: 'Red T-Shirt',
            variant_title: 'Medium',
            sku: 'TSHIRT-RED-M',
            vendor: 'Acme',
            quantity: 2,
            price: '19.99',
            fulfillment_status: 'fulfilled',
            product_id: '987654321',
            variant_id: '44556677',
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
      // Webhook STEERING: an `inventory_levels/update` delivery carries the changed
      // inventory_item_id as `resourceId` (extractTriggerData) — the platform debounces
      // same-item bursts, then re-invokes `execute` with `triggerContext.resourceId` for
      // a targeted single-product partial fetch (the variants[] fan-out refreshes all
      // sibling variants' quantities in the same page).
      webhookTrigger: {
        filter: { topic: 'inventory_levels/update' },
        paths: ['resourceId'],
        debounceMs: 10_000,
      },
      fields: {
        // The declared External ID: a real "Shopify Product ID" column marked as the
        // record's dedupe/link key (equals ConnectorRecord.externalId, which the order
        // stream's line→product reference resolves against).
        shopify_id: {
          type: 'TEXT',
          name: 'Shopify Product ID',
          sourcePath: 'id',
          isExternalId: true,
        },
        title: { type: 'TEXT', name: 'Title', sourcePath: 'title' },
        bodyHtml: { type: 'RICH_TEXT', name: 'Description', sourcePath: 'body_html' },
        vendor: { type: 'TEXT', name: 'Vendor', sourcePath: 'vendor' },
        productType: { type: 'TEXT', name: 'Product Type', sourcePath: 'product_type' },
        handle: { type: 'TEXT', name: 'Handle', sourcePath: 'handle' },
        status: {
          type: 'SINGLE_SELECT',
          name: 'Status',
          sourcePath: 'status',
          options: PRODUCT_STATUS_OPTIONS,
        },
        tags: { type: 'TAGS', name: 'Tags', sourcePath: 'tags' },
        createdAt: { type: 'DATETIME', name: 'Shopify Created', sourcePath: 'created_at' },
        publishedAt: { type: 'DATETIME', name: 'Published At', sourcePath: 'published_at' },
        updatedAt: { type: 'DATETIME', name: 'Shopify Updated', sourcePath: 'updated_at' },
        // Variants — fanned out per element into the owned shopify_variants def
        // (has_many child of shopify_products). Read straight off the embedded
        // `variants[]` /products.json already returns; no extra fetch. The variant's
        // own Shopify id is its declared External ID (D4) — the stable row a `part`
        // links to (v9 Piece B) and the reference each inventory movement records.
        'variants.shopifyId': {
          type: 'TEXT',
          name: 'Shopify Variant ID',
          sourcePath: 'variants[].id',
          isExternalId: true,
        },
        // The delta driver — the auxx-side cell whose old → new change v9 Piece C
        // deducts against.
        'variants.inventoryQuantity': {
          type: 'NUMBER',
          name: 'Inventory Quantity',
          sourcePath: 'variants[].inventory_quantity',
        },
        // Webhook join key (inventory_levels/update carries inventory_item_id, not the
        // variant id) + phase-2 real-time push-back.
        'variants.inventoryItemId': {
          type: 'TEXT',
          name: 'Inventory Item ID',
          sourcePath: 'variants[].inventory_item_id',
        },
        'variants.sku': { type: 'TEXT', name: 'SKU', sourcePath: 'variants[].sku' },
        // NOT the raw Shopify variant title: projection rewrites it to the
        // product-qualified display title ("Product - Grey / 42", product title alone
        // for single-variant products' "Default Title") — see variantDisplayTitle().
        // It's the primaryDisplayField below; raw options stay in option1–3.
        'variants.title': { type: 'TEXT', name: 'Variant Title', sourcePath: 'variants[].title' },
        'variants.price': {
          type: 'CURRENCY',
          name: 'Variant Price',
          sourcePath: 'variants[].price',
        },
        'variants.position': {
          type: 'NUMBER',
          name: 'Position',
          sourcePath: 'variants[].position',
        },
        'variants.option1': { type: 'TEXT', name: 'Option 1', sourcePath: 'variants[].option1' },
        'variants.option2': { type: 'TEXT', name: 'Option 2', sourcePath: 'variants[].option2' },
        'variants.option3': { type: 'TEXT', name: 'Option 3', sourcePath: 'variants[].option3' },
      },
      // Owned shopify_products — same apiSlug the order stream's reference targets, so
      // both resolve to one def (the connector owns it; no ownership conflict).
      defaultMappings: [
        {
          rootPath: '',
          target: {
            mode: 'owned',
            entity: {
              key: 'products',
              apiSlug: 'shopify_products',
              singular: 'Shopify Product',
              plural: 'Shopify Products',
              primaryDisplayField: 'title',
            },
          },
        },

        // variants[] → owned shopify_variants, has_many child of the product. The
        // platform provisions the `Variants` edge on the product def + the `Product`
        // belongs_to inverse on the variant def, exactly like order → line_items. No
        // targetRef → owned child. Deliberately NO `→ part` edge here (D1): the
        // part ↔ variant link is auxx-side (v9 Piece B), pointing at this owned def.
        {
          rootPath: 'variants[]',
          relationshipFieldKey: 'variants',
          relationship: {
            fieldKey: 'variants',
            name: 'Variants',
            cardinality: 'has_many',
            inverseName: 'Product',
            // no targetRef → owned child (this mapping's own shopify_variants def)
          },
          target: {
            mode: 'owned',
            entity: {
              key: 'variants',
              apiSlug: 'shopify_variants',
              singular: 'Shopify Variant',
              plural: 'Shopify Variants',
              // Fields under this fan-out are namespaced `variants.*` (to avoid colliding
              // with the product's own `title`) — primaryDisplayField must match that key,
              // not the bare source-path name.
              primaryDisplayField: 'variants.title',
            },
          },
        },
      ],
      syncMode: 'incremental',
      exampleRecord: {
        id: '987654321',
        title: 'Red T-Shirt',
        body_html: '<p>Soft cotton tee.</p>',
        vendor: 'Acme',
        product_type: 'Apparel',
        handle: 'red-t-shirt',
        status: 'active',
        tags: ['summer', 'cotton'],
        created_at: '2024-01-05T08:00:00Z',
        published_at: '2024-01-06T08:00:00Z',
        updated_at: '2024-01-10T08:00:00Z',
        variants: [
          {
            id: '44556677',
            title: 'Medium',
            sku: 'TSHIRT-RED-M',
            price: '19.99',
            position: 1,
            option1: 'Medium',
            inventory_quantity: 42,
            inventory_item_id: '99887766',
          },
        ],
      },
    },
  ],
  execute: shopifySync,
})
