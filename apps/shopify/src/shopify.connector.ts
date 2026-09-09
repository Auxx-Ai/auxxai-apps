// src/shopify.connector.ts
//
// The single Shopify data connector. One connector per app, MANY streams — the
// platform supports multiple streams per connector but resolves one connector per
// app slug, so everything Shopify syncs hangs off this one declaration:
//   • `customer` → contributing system `contact` (merge on email, then phone).
//   • `order`    → contributing native `order`, embedded customer → contributing
//                  `contact`, `line_items[]` → contributing native `line_item`,
//                  `line_items[].variant_id` → reference to native `part`,
//                  `refunds[]` → contributing native `refund`,
//                  `refunds[].refund_line_items[]` → contributing native
//                  `refund_line`, `refunds[].refund_line_items[].line_item_id`
//                  → reference to the native `line_item` it refunds, and
//                  `tax_lines[]` → contributing native `tax_line`.
//   • `product`  → contributing native `product`, `variants[]` → contributing
//                  native `part` (+ a flat drilled child onto `catalog_item`).
//
// Retargeted off the connector's four old owned defs (`shopify_orders`,
// `shopify_line_items`, `shopify_products`, `shopify_variants`) onto the native
// entities — money plan 37 (`plans/money/tasks/37-shopify-native-retarget.md`).
// After this, Shopify declares NO entities: every column is either a native
// system attribute or a `defineFields` app field (`fields.ts`). `R1`/`R2` are
// both retired (§0/§1 of the plan) — the order stream is no longer connector-
// owned, and nobody has ever used the app, so the historical rows are discarded
// rather than migrated.
//
// Every `relationshipFieldKey` below names a `system:<systemAttribute>` edge
// already declared on the target's registry field — nothing is provisioned by
// this manifest, the resolver just looks the edge up. Verified against
// `packages/lib/src/resources/registry/resources/{order,line-item,part,product,
// catalog-item,contact}-fields.ts` on 2026-09-02 (money plan 37 §7.1 footnote):
// `product_parts` (on `product`), `part_catalog_items` (on `part`),
// `order_line_items` / `order_contact` (on `order`), `line_item_part` (on
// `line_item`). The resolver resolves the key against the PARENT def, which is
// why the catalog-item edge is `system:part_catalog_items`, not
// `system:catalog_item_part`.
//
// The refund and tax-line edges added by money plans 47 and 48 follow the same
// rule and were verified against `resources/registry/resources/{order,refund,
// refund-line}-fields.ts` on 2026-09-08, after entity migration 136 landed:
// `order_refunds` / `order_tax_lines` (on `order`), `refund_lines` (on
// `refund`), `refund_line_line_item` (on `refund_line`).
//
// ── `derived.*` fields ────────────────────────────────────────────────────────
// Some order and line-item fields source paths that DO NOT EXIST in Shopify's
// payload (`firstFulfilledAt`, `lineItems[].fulfilledAt`, …). They are
// synthesised by the server handler's `deriveFulfillments()` walk over
// `order.fulfillments[]`, which is the only place a ship date lives — and the
// ship date is the accrual revenue trigger. Synthetic source paths are
// first-class: the stream's source schema is built from the union of every
// mapping's source paths plus `exampleRecord`, not from a live sample.
//
// ⚠️ Any field whose projected value is an ARRAY or an OBJECT is silently dropped
// by the fan-out before it reaches the field-value layer — no error, no null, no
// write — unless it targets a JSON field (`raw`). `tags` and `paymentGateways`
// are therefore delivered as COMMA STRINGS.

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import { z } from '@auxx/sdk/tools'
import shopifySync from './shopify.connector.server'

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
    // Storefront customers → system `contact` (contributing, merge on email/phone).
    // External id = Shopify customer id; `email` and `phone` are the secondary
    // identity-match keys, so an imported customer merges into an existing contact on
    // first link — phone included, because a phone-signup customer has no email.
    // Incremental, like the other two streams: the customers endpoint honours
    // `updated_at_min`, and a snapshot stream can never finish a large customer list
    // because a snapshot backfill restarts from page one on every resume while the
    // platform's per-run ingest ceiling parks it partway through.
    {
      key: 'customer',
      syncMode: 'incremental',
      mappings: [
        {
          rootPath: '',
          target: { entityKind: 'contact' },
          fields: [
            { sourcePath: 'id', appField: 'customerId' }, // identity -> externalId
            { sourcePath: 'email', target: 'primary_email', match: true },
            // `fill_blank` on every non-identity binding (money plan 39 §3.2 /
            // §6.3): a customer that matches an existing contact by email must
            // not have hand-maintained CRM fields overwritten by the storefront
            // copy. Shopify fills what is empty and leaves the rest alone.
            { sourcePath: 'first_name', target: 'first_name', mergeStrategy: 'fill_blank' },
            { sourcePath: 'last_name', target: 'last_name', mergeStrategy: 'fill_blank' },
            // Phone is a SECOND identity key, not just data. A Shopify account created
            // by SMS / phone-only signup carries no email at all, so `primary_email`
            // cannot re-identify it: once the item bindings are dropped (any
            // `identity-match` edit is a `rebind`, and a contributing mapping keeps its
            // instances), every one of those customers re-creates as a duplicate.
            // Plain `true` rather than `'exclusive'` for the same reason `primary_email`
            // is: skipping a collision would leave that order's contact edge pending
            // forever. `fill_blank` still applies — a match key is not a write policy.
            { sourcePath: 'phone', target: 'phone', match: true, mergeStrategy: 'fill_blank' },
            // Default-address scalars — bound onto the contact's existing city/
            // region/country TEXT fields (contact has no ADDRESS_STRUCT). The
            // server flattens `default_address.*` onto these source paths.
            { sourcePath: 'default_address.city', target: 'city', mergeStrategy: 'fill_blank' },
            {
              sourcePath: 'default_address.province',
              target: 'region',
              mergeStrategy: 'fill_blank',
            },
            {
              sourcePath: 'default_address.country',
              target: 'country',
              mergeStrategy: 'fill_blank',
            },
            { sourcePath: 'note', target: 'notes', mergeStrategy: 'fill_blank' },
            // Resale/dealer exemption (48 §4.4). Bound on THIS stream as well as
            // on the order's embedded customer, so a contact who has not ordered
            // yet still carries the flag - for a dealer business it is what
            // separates "exempt for resale" from "simply never taxed".
            // `fill_blank` like every non-identity binding above: an exemption a
            // human asserted in auxx (they hold the certificate; Shopify does
            // not supply one) must not be cleared by the storefront's copy.
            // 🔀 The cost is that a LATER change at Shopify never propagates,
            // because a written `false` is no longer blank.
            {
              sourcePath: 'tax_exempt',
              target: 'contact_tax_exempt',
              mergeStrategy: 'fill_blank',
            },
            // Source-only — no target/appField, kept for Layer A schema
            // visibility so a merchant can hand-map them at setup if they want.
            { sourcePath: 'orders_count', type: 'NUMBER', name: 'Orders' },
            { sourcePath: 'total_spent', type: 'CURRENCY', name: 'Total Spent' },
            { sourcePath: 'created_at', type: 'DATETIME', name: 'Shopify Created' },
          ],
          connectionFields: [{ appField: 'storeDomain', from: 'label' }],
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
        tax_exempt: false,
        default_address: { city: 'Austin', province: 'Texas', country: 'United States' },
      },
    },

    // ── product ─────────────────────────────────────────────────────────────────
    // Product catalog → native `product`, its `variants[]` → native `part` (money
    // plan 37 §7.1, `R1`). Parts MATCH on SKU (money plan 39 §6.1 / §6.2): the
    // variant mapping binds `part_sku` with `match: 'exclusive'`, the same
    // mechanism as `primary_email` on the contact mappings except that a second
    // hit is a collision (two variants, one SKU) rather than one thing seen
    // twice (a guest checkout and a customer sharing an email both bind). The first sync at a merchant with
    // existing parts (DemoOrg1: 246 parts predating the connector) rejected every
    // variant whose SKU an existing part already carried - the unique check
    // dropped the SKU, then the required check refused the write - instead of
    // linking them, which is what "adoption is opt-in" (shopify-product-mapping.md
    // §3, now reversed) cost in practice. The sink resolves by variant id first,
    // then by SKU; a blank SKU never matches and creates. A SKU duplicated INSIDE
    // Shopify is skipped by the sink with a reason, never bound to a sibling's
    // part (that is what `'exclusive'` buys). `part_title` is `fill_blank` so a hand-named part keeps its name;
    // `price` and `externalQuantity` stay overwrite because they mirror the
    // store (§6.3). `part_quantity_on_hand` is NEVER a target —
    // `recalculatePartQoH` re-sums the whole movement ledger on every movement
    // write, so a sink write there is overwritten by the next movement; Shopify's
    // count goes to the `externalQuantity` app field and the drift check becomes
    // a column comparison.
    {
      key: 'product',
      syncMode: 'incremental',
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
      mappings: [
        // Shopify product -> native product.
        {
          rootPath: '',
          target: { entityKind: 'product' },
          fields: [
            { sourcePath: 'shopify_id', appField: 'productId' }, // identity -> externalId
            { sourcePath: 'title', target: 'product_title' },
            { sourcePath: 'bodyHtml', target: 'product_description' },
            { sourcePath: 'productType', target: 'product_type' },
            { sourcePath: 'handle', target: 'product_handle' },
            { sourcePath: 'status', target: 'product_status' },
            { sourcePath: 'tags', target: 'category' },
          ],
          // No `connectionFields` here — `storeDomain` is declared on
          // `contact` only (fields.ts); `product` has no per-connection
          // app field to fill from connection metadata.
        },

        // variants[] -> native part, child of the product above (prefix-derived parent).
        {
          rootPath: 'variants[]',
          relationshipFieldKey: 'system:product_parts',
          target: { entityKind: 'part' },
          fields: [
            { sourcePath: 'shopifyId', appField: 'variantId' }, // identity -> externalId
            { sourcePath: 'title', target: 'part_title', mergeStrategy: 'fill_blank' },
            { sourcePath: 'sku', target: 'part_sku', match: 'exclusive' },
            { sourcePath: 'price', appField: 'price' },
            { sourcePath: 'inventoryQuantity', appField: 'externalQuantity' },
          ],
        },

        // FLAT DRILLED CHILD: the same variants[] subtree also contributes the
        // catalog item that carries the sell price (shopify-product-mapping.md
        // §5.1). Needs parentRootPath because it is a SECOND mapping over the
        // same subtree as its sibling (the `part` mapping) above.
        {
          rootPath: 'variants[]',
          parentRootPath: 'variants[]',
          relationshipFieldKey: 'system:part_catalog_items',
          target: { entityKind: 'catalog_item' },
          fields: [
            // `fill_blank` as the part title (plan 39 §6.3); the unit price stays
            // overwrite because Shopify is the main price.
            { sourcePath: 'title', target: 'catalog_item_name', mergeStrategy: 'fill_blank' },
            { sourcePath: 'price', target: 'catalog_item_default_unit_price' },
            // A CONSTANT, not a source path: Shopify has no field that answers
            // "what kind of sellable thing is this", and `catalog_item_category`
            // is a closed enum (service | material | labor) that free text like
            // `productType` ("Apparel", "Snowboard") cannot fill. A Shopify
            // product variant is a physical good, so the connector says so.
            //
            // Without this the platform's `applyDefaults` fills the registry
            // default `service` on every synced item, because this mapping never
            // mentions the field. That mislabelled 276 of 276 connector-managed
            // items in production, 275 of them carrying a part link and therefore
            // demonstrably goods. `overwrite` (the default) is what repairs them:
            // the next sync rewrites the category on rows already landed.
            { constant: 'material', target: 'catalog_item_category' },
          ],
        },
      ],
      exampleRecord: {
        shopify_id: '987654321',
        title: 'Red T-Shirt',
        bodyHtml: '<p>Soft cotton tee.</p>',
        vendor: 'Acme',
        productType: 'Apparel',
        handle: 'red-t-shirt',
        status: 'active',
        // Comma STRING, matching the projection — an array is silently dropped
        // by the fan-out.
        tags: 'summer, cotton',
        createdAt: '2024-01-05T08:00:00Z',
        publishedAt: '2024-01-06T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z',
        variants: [
          {
            shopifyId: '44556677',
            title: 'Red T-Shirt - Medium',
            sku: 'TSHIRT-RED-M',
            price: 1999,
            inventoryQuantity: 42,
            inventoryItemId: '99887766',
            position: 1,
            option1: 'Medium',
            option2: null,
            option3: null,
          },
        ],
      },
    },

    // ── order ─────────────────────────────────────────────────────────────────────
    // REST /orders.json (line items embedded) → native `order`, embedded customer
    // → contributing `contact`, `line_items[]` → native `line_item`,
    // `line_items[].variant_id` → reference to native `part` (money plan 37 §7.2,
    // closing `R2`). Totals are TRANSCRIBED, the `vendor_bill` way (§6): the sink
    // writes `order_subtotal` / `order_discount_*` / `order_tax_total` /
    // `order_shipping_total` / `order_total` under its `sync` session, and the
    // totals reconciler + the sync finalize integrity pass stand down for a
    // connector-managed field on a connector-managed record — the platform side
    // of that stand-down is out of this app's scope.
    {
      key: 'order',
      syncMode: 'incremental',
      mappings: [
        {
          rootPath: '',
          target: { entityKind: 'order' },
          fields: [
            { sourcePath: 'shopify_id', appField: 'shopifyOrderId' }, // identity -> externalId
            // `#1001` (the merchant's prefix and suffix included) fills
            // `order_number` once: `fill_blank` writes it on create, and the
            // numbering hook keeps a supplied number instead of allocating
            // `ORD-000N` ("theirs if they bring one, otherwise ours", money
            // plan 39 section 6.5). Hand-created orders still get `ORD-`.
            // The `orderName` app field is redundant but kept as a grid column.
            { sourcePath: 'name', target: 'order_number', mergeStrategy: 'fill_blank' },
            { sourcePath: 'name', appField: 'orderName' },
            { sourcePath: 'createdAt', target: 'order_placed_at' },
            { sourcePath: 'cancelledAt', target: 'order_cancelled_at' },
            { sourcePath: 'financialStatus', target: 'order_financial_status' },
            { sourcePath: 'fulfillmentStatus', target: 'order_fulfillment_status' },
            { sourcePath: 'currency', target: 'order_currency' },
            // Deliberately no predefined `options` on this source field: the
            // live gateway handle set is what has to be discovered empirically
            // (see the server projection), and TAGS never rejects a value the
            // way a bounded SINGLE_SELECT would.
            { sourcePath: 'paymentGateways', target: 'order_payment_gateways' },
            { sourcePath: 'tags', target: 'category' },
            { sourcePath: 'shippingAddress', target: 'order_shipping_address' },
            // `fill_blank`: a note typed in auxx survives a resync (§10.1).
            { sourcePath: 'note', target: 'order_note', mergeStrategy: 'fill_blank' },
            // Transcribed totals (§6). The totals engine stands down for a
            // connector-managed order.
            { sourcePath: 'subtotalPrice', target: 'order_subtotal' },
            { sourcePath: 'discountType', target: 'order_discount_type' }, // projection emits 'amount'
            { sourcePath: 'totalDiscounts', target: 'order_discount_value' },
            { sourcePath: 'totalTax', target: 'order_tax_total' },
            { sourcePath: 'totalShipping', target: 'order_shipping_total' },
            { sourcePath: 'totalPrice', target: 'order_total' },
            // Fulfillment rollup: Shopify's summary, not a fact at auxx's grain
            // (§5.2) — app fields, not native.
            { sourcePath: 'firstFulfilledAt', appField: 'firstFulfilledAt' },
            { sourcePath: 'lastFulfilledAt', appField: 'lastFulfilledAt' },
            { sourcePath: 'shipmentCount', appField: 'shipmentCount' },
            { sourcePath: 'isSplitShipment', appField: 'isSplitShipment' },
            // Everything not modelled above: refunds, tax lines, shipping
            // lines, discount applications/allocations (§6, §8's "cheapest
            // thing in this brief and possibly the most valuable").
            { sourcePath: 'raw', appField: 'raw' },
          ],
          // No `connectionFields` here — `storeDomain` is declared on
          // `contact` only (fields.ts); it is filled on the embedded
          // `customer` branch below, not on the order root.
        },

        // Embedded customer -> contact, unchanged in shape, retargeted edge
        // (system:order_contact instead of the old owned-def relationship).
        {
          rootPath: 'customer',
          relationshipFieldKey: 'system:order_contact',
          target: { entityKind: 'contact' },
          fields: [
            { sourcePath: 'id', appField: 'customerId' },
            { sourcePath: 'email', target: 'primary_email', match: true },
            // Tax exemption (money plan 48 §4.4). 24 of 250 measured orders are
            // to an exempt customer, and until now nothing distinguished a
            // dealer buying for resale from a sale that was simply never taxed.
            // ⚠️ The FLAG is all Shopify gives: `tax_exemptions[]` was empty on
            // every order measured, so the exemption reason and the resale
            // certificate are not available here and stay a compliance surface.
            { sourcePath: 'taxExempt', target: 'contact_tax_exempt' },
          ],
          connectionFields: [{ appField: 'storeDomain', from: 'label' }],
        },

        // line_items[] -> native line_item, child of the order above.
        {
          rootPath: 'line_items[]',
          relationshipFieldKey: 'system:order_line_items',
          target: { entityKind: 'line_item' },
          fields: [
            { sourcePath: 'shopifyId', appField: 'shopifyLineId' }, // identity -> externalId
            { sourcePath: 'title', target: 'line_item_name' },
            { sourcePath: 'variantTitle', target: 'line_item_description' },
            { sourcePath: 'quantity', target: 'line_item_qty' },
            { sourcePath: 'price', target: 'line_item_unit_price' },
            // Transcribed (§6.2): price × qty − Σ this line's discount
            // allocations. The finalize pass's line arm stands down for a
            // connector-managed line.
            { sourcePath: 'lineTotal', target: 'line_item_line_total' },
            { sourcePath: 'index', target: 'line_item_sort_order' },
            // Tax, per line (money plan 48 §4.2 / §4.3). `line_item_taxable`
            // has been in the registry since money plan 37 and unbound until
            // now; `line_item_tax_total` is new in entity migration 136.
            //
            // Deliberately a SCALAR and not a `tax_lines[]` fan-out per line:
            // filing needs the jurisdiction split per ORDER (the `tax_lines[]`
            // mapping below), and the fulfillment builder needs one number per
            // line. Fanning the per-line breakdown out too would multiply ~63k
            // records over the order history to answer nothing.
            //
            // ⚠️ `taxTotal` is projected from `total_tax_set.shop_money.amount`,
            // a STRING, never the bare `total_tax` sibling, which is a NUMBER
            // carrying the same value (47 §4.1, measured). This is what lets
            // `buildFulfillmentEntry` use exact per-line tax instead of
            // allocating the order total pro rata across split shipments.
            { sourcePath: 'taxable', target: 'line_item_taxable' },
            { sourcePath: 'taxTotal', target: 'line_item_tax_total' },
            // `sku` / `vendor` bind nothing — the part already carries both.
            // The fulfillment rollup, all app fields (§5.2/§7.3).
            { sourcePath: 'fulfilledAt', appField: 'fulfilledAt' },
            { sourcePath: 'lastFulfilledAt', appField: 'lastFulfilledAt' },
            { sourcePath: 'fulfilledQuantity', appField: 'fulfilledQuantity' },
            { sourcePath: 'shipmentCount', appField: 'shipmentCount' },
            { sourcePath: 'fulfillableQuantity', appField: 'fulfillableQuantity' },
            { sourcePath: 'trackingNumber', appField: 'trackingNumber' },
          ],
        },

        // line -> part, replacing the two owned reference mappings (product +
        // variant). Resolves by (connector, part def, variant id) because the
        // variants[] mapping above designates `variantId` as its external id
        // (§10.5) — a line whose part has not synced yet has no retry, so the
        // product stream's backfill should complete before the order stream's.
        {
          rootPath: 'line_items[].variant_id',
          linkMode: 'reference',
          relationshipFieldKey: 'system:line_item_part',
          target: { entityKind: 'part' },
        },

        // refunds[] -> native refund, child of the order above (money plan 47
        // §2, `plans/money/tasks/47-shopify-refunds.md`). A fan-out out of the
        // order payload the connector already fetches, NOT a dedicated
        // `refunds/create` stream: it needs no new fetch, watermark or
        // pagination, it rides orders' Protected Customer Data approval instead
        // of waiting on its own, and idempotency is free because `refunds[]` is
        // a snapshot re-delivered on every order sync keyed on Shopify's stable
        // `refund.id`. The dedicated stream wins only on latency and can be
        // added later without rework (47 §2).
        //
        // ⚠️ There is NO total on a Shopify refund (47 §2.1). The measured
        // top-level keys are `created_at, duties, id, note, order_adjustments,
        // processed_at, refund_duties, refund_line_items,
        // refund_shipping_lines, restock, transactions, user_id` and none of
        // them is an amount. `amountRefunded` is therefore a DERIVATION the
        // projection computes - the sum of the successful refund transactions,
        // the money that actually moved - and it is named for that rather than
        // called a total. A field called `refund_total` would have been null on
        // every row, silently.
        {
          rootPath: 'refunds[]',
          relationshipFieldKey: 'system:order_refunds',
          target: { entityKind: 'refund' },
          fields: [
            { sourcePath: 'shopifyRefundId', appField: 'shopifyRefundId' }, // identity -> externalId
            // The refund's OWN date, never ingest time. The connector is
            // manual-only today, so the gap between a refund happening and auxx
            // seeing it is unbounded and can cross a period close (47 §5.3).
            { sourcePath: 'createdAt', target: 'refund_created_at' },
            { sourcePath: 'note', target: 'refund_note' },
            { sourcePath: 'amountRefunded', target: 'refund_amount_refunded' },
          ],
        },

        // refunds[].refund_line_items[] -> native refund_line, the GOODS leg of
        // a refund (47 §2.2, §3). Parent derives from the longest boundary
        // prefix, which is the `refunds[]` mapping above, so no
        // `parentRootPath` is needed.
        //
        // ⚠️ Most refunds have NO lines. Measured over the readable window, 8
        // of 11 refunds moved money with zero `refund_line_items[]` - a
        // concession or a discrepancy adjustment, not a physical return - so
        // this mapping is the minority case and the refund record above is
        // where the money actually lives (47 §3).
        //
        // ⚠️ `restock` is deliberately NOT bound. It is deprecated in favour of
        // `restock_type`, and it sits at the refund level where the fact is per
        // line. It is in the payload, so it will look bindable. `location_id`
        // is left out for a different reason: nothing consumes it until the
        // inventory leg exists (47 §2.2).
        //
        // `disposition` is auxx's own provider-neutral vocabulary
        // (returned / not_returned / cancelled); the projection maps Shopify's
        // `restock_type` token into it rather than storing the token, which is
        // what `1200 Shopify Clearing` -> `1200 Card Clearing` cost when it was
        // skipped (47 §3, §9 rule 1).
        {
          rootPath: 'refunds[].refund_line_items[]',
          relationshipFieldKey: 'system:refund_lines',
          target: { entityKind: 'refund_line' },
          fields: [
            { sourcePath: 'shopifyRefundLineId', appField: 'shopifyRefundLineId' }, // identity -> externalId
            { sourcePath: 'quantity', target: 'refund_line_qty' },
            // Both money paths are the `_set.shop_money.amount` STRING, never
            // the bare `subtotal` / `total_tax` scalars (47 §4.1).
            { sourcePath: 'subtotal', target: 'refund_line_subtotal' },
            { sourcePath: 'taxTotal', target: 'refund_line_tax_total' },
            { sourcePath: 'disposition', target: 'refund_line_disposition' },
          ],
        },

        // refund line -> the order line it refunds, `reference` mode, the same
        // shape as `line_items[].variant_id` -> part above (47 §2.2). Resolves
        // by (connector, line_item def, Shopify line id) because the
        // `line_items[]` mapping designates `shopifyLineId` as its external id.
        //
        // Unlike the part reference, the target here is in the SAME order
        // payload rather than in another stream, so it is not exposed to the
        // product backfill having to finish first.
        {
          rootPath: 'refunds[].refund_line_items[].line_item_id',
          linkMode: 'reference',
          relationshipFieldKey: 'system:refund_line_line_item',
          target: { entityKind: 'line_item' },
        },

        // tax_lines[] -> native tax_line, the per-jurisdiction breakdown of the
        // order tax total the root mapping already transcribes (money plan 48
        // §4.1, `plans/money/tasks/48-shopify-tax-data.md`).
        //
        // auxx does NOT calculate tax and never will (48's banner). This
        // carries the answer Shopify already computed: `rate` is display and
        // filing only and is never multiplied by anything, and `price` is the
        // amount as supplied.
        //
        // Records rather than a JSON blob because the question is "tax by
        // jurisdiction over a period", which is an aggregation and aggregations
        // want rows. Additive and safe: `sum(tax_lines.price) == total_tax` on
        // all 250 orders measured, so nothing that posts today changes.
        //
        // ⚠️ Multi-jurisdiction is the NORM - 104 of 123 taxed orders carry more
        // than one line - which is why the registry's `order_tax_rate` scalar
        // stays unbound. It can represent 19 of 123 orders, and a partial
        // answer there reads as a complete one (48 §2).
        //
        // ⚠️ `channelLiable` is not decoration: it is the one field on this
        // record the LEDGER branches on. When it is true a marketplace
        // facilitator remits that tax, not the merchant, so crediting it to
        // `2200 Sales Tax Payable` books a liability the business does not owe
        // and will never pay down (48 §3, §6.4).
        {
          rootPath: 'tax_lines[]',
          relationshipFieldKey: 'system:order_tax_lines',
          target: { entityKind: 'tax_line' },
          fields: [
            // ⚠️ SYNTHETIC identity - Shopify tax lines carry no id at all. See
            // `shopifyTaxLineKey` in fields.ts for what the key is made of.
            { sourcePath: 'taxLineKey', appField: 'shopifyTaxLineKey' }, // identity -> externalId
            { sourcePath: 'title', target: 'tax_line_title' },
            { sourcePath: 'rate', target: 'tax_line_rate' },
            // `price_set.shop_money.amount`, the STRING (48 §8.1).
            { sourcePath: 'price', target: 'tax_line_price' },
            { sourcePath: 'channelLiable', target: 'tax_line_channel_liable' },
          ],
        },
      ],
      // Backfill once, then run deltas off the `updated_at` watermark.
      exampleRecord: {
        shopify_id: '1234567890',
        name: '#1001',
        email: 'jane@example.com',
        currency: 'USD',
        totalPrice: 4999,
        subtotalPrice: 4599,
        totalTax: 400,
        totalDiscounts: 0,
        totalShipping: 500,
        discountType: 'amount',
        financialStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        cancelReason: null,
        // Comma STRING, matching the projection — Shopify's own shape, and the
        // shape `normalizeFieldValue` splits. An array here would be silently
        // dropped.
        paymentGateways: 'shopify_payments',
        tags: 'vip, gift',
        note: 'Leave at front door',
        createdAt: '2024-02-11T10:00:00Z',
        processedAt: '2024-02-11T10:01:00Z',
        cancelledAt: null,
        // Deliberately a SPLIT SHIPMENT — 2 units then 1, four days apart — so
        // the example itself documents the case these fields exist for.
        firstFulfilledAt: '2024-02-12T09:00:00Z',
        lastFulfilledAt: '2024-02-15T14:30:00Z',
        shipmentCount: 2,
        isSplitShipment: true,
        shippingAddress: {
          street1: '123 Main St',
          street2: 'Apt 4',
          city: 'Austin',
          state: 'Texas',
          zipCode: '78701',
          country: 'United States',
        },
        billingAddress: {
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
          firstName: 'Jane',
          lastName: 'Doe',
          taxExempt: false,
        },
        line_items: [
          {
            shopifyId: '11223344',
            title: 'Red T-Shirt',
            variantTitle: 'Medium',
            sku: 'TSHIRT-RED-M',
            vendor: 'Acme',
            quantity: 3,
            fulfillableQuantity: 0,
            price: 1999,
            lineTotal: 5997,
            index: 0,
            taxable: true,
            // Minor units, from `total_tax_set.shop_money.amount` (48 §8.1).
            taxTotal: 400,
            fulfillmentStatus: 'fulfilled',
            variant_id: '44556677',
            // Same line, two shipments: 2 units on the 12th, 1 on the 15th.
            // `trackingNumber` is null BECAUSE `shipmentCount` is 2 — there is
            // no one tracking number for this line.
            fulfilledAt: '2024-02-12T09:00:00Z',
            lastFulfilledAt: '2024-02-15T14:30:00Z',
            fulfilledQuantity: 3,
            shipmentCount: 2,
            trackingNumber: null,
          },
        ],
        // A partial refund with one returned line (money plans 47 §2 / 48 §4.1).
        // Money is already in MINOR UNITS here, like every other amount in this
        // example: the projection scales the provider's decimal strings before
        // the mapping ever sees them.
        refunds: [
          {
            shopifyRefundId: '55667788',
            createdAt: '2024-02-20T11:00:00Z',
            note: 'Customer returned one shirt',
            // Σ successful refund transactions, NOT a Shopify field (47 §2.1).
            amountRefunded: 2132,
            refund_line_items: [
              {
                shopifyRefundLineId: '99001122',
                line_item_id: '11223344',
                quantity: 1,
                subtotal: 1999,
                taxTotal: 133,
                // auxx's vocabulary, mapped from Shopify's `restock_type`.
                disposition: 'returned',
              },
            ],
          },
        ],
        // Order-level jurisdiction breakdown. `sum(price) == totalTax` on every
        // order measured, and more than one line is the norm (48 §1, §2).
        tax_lines: [
          {
            taxLineKey: '1234567890:CA State Tax',
            title: 'CA State Tax',
            rate: 0.06,
            price: 276,
            channelLiable: false,
          },
          {
            taxLineKey: '1234567890:Ventura County Tax',
            title: 'Ventura County Tax',
            rate: 0.0275,
            price: 124,
            channelLiable: false,
          },
        ],
        raw: {
          refunds: [],
          tax_lines: [{ title: 'CA Sales Tax', price: '4.00', rate: 0.087 }],
          shipping_lines: [{ title: 'Standard', price: '5.00', code: 'Standard' }],
          discount_applications: [],
          discount_allocations: [],
        },
      },
    },
  ],
  execute: shopifySync,
})
