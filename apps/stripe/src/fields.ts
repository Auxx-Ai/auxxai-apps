// src/fields.ts

import { defineFields } from '@auxx/sdk/fields'

/**
 * Contact custom fields the Stripe app owns — one per connected Stripe account
 * (`scope: 'connection'`). Provisioned on connection-added, removed on
 * connection-removed / uninstall.
 *
 * - `customerId` — the contact's Stripe customer id (`cus_…`). The binding
 *   target for dynamic-select quick-action inputs (e.g. Refund Charge resolves
 *   the contact's charges from it). Hidden; provisions empty until the separate
 *   link/sync plan populates values. See plans/actions/09-dynamic-action-inputs.md
 *   and plans/actions/10-link-contact-to-stripe.md.
 */
export const stripeFields = defineFields([
  {
    appFieldKey: 'customerId',
    type: 'TEXT',
    targetEntity: 'contact',
    scope: 'connection',
    name: 'Stripe customer ID',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
])
