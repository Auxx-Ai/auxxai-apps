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
 */
export const shopifyFields = defineFields([
  {
    appFieldKey: 'customerId',
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
    appFieldKey: 'storeDomain',
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
    appFieldKey: 'variantId',
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
    appFieldKey: 'externalQuantity',
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
    appFieldKey: 'price',
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
    appFieldKey: 'productId',
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
])
