// src/fields.ts

import { defineFields } from '@auxx/sdk/fields'

/**
 * Contact custom fields the Shopify app owns — one set per connected store
 * (`scope: 'connection'`). Provisioned on `connection-added`, removed on
 * `connection-removed` / uninstall.
 *
 * - `customerId` — the chat-safe order **fence key**: a verified storefront
 *   customer's Shopify customer id, written platform-side from the
 *   App-Proxy-signed JWT at passport mint (never from visitor input). The
 *   order tools scope lookups to this id and ignore any visitor-supplied
 *   id/email. Hidden; a bare customer id is only unique within a shop, which
 *   the per-connection scope preserves.
 * - `storeDomain` — CRM-only: lets contacts be filtered/segmented by store
 *   domain. Visible + filterable; **never** read by the order fence.
 */
export const shopifyFields = defineFields([
  {
    appFieldKey: 'customerId',
    type: 'TEXT',
    targetEntity: 'contact',
    scope: 'connection',
    name: 'Shopify customer ID',
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
])
