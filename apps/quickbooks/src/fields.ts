// src/fields.ts

import { defineFields } from '@auxx/sdk/fields'

/**
 * Identity custom fields the QuickBooks app owns — one set per connected
 * QuickBooks company (`scope: 'connection'`). These are the id-map keys the
 * invoice-sync orchestrator (`packages/lib/src/money/quickbooks/sync-invoice.ts`)
 * reads/writes via `RecordIdentity` to keep pushes idempotent (find-or-create
 * instead of duplicate customers/items/invoices on re-sync).
 *
 * All three are hidden, `identity: true` text fields — the platform mirrors
 * writes into `RecordIdentity` (`source:'quickbooks'`) and the orchestrator
 * resolves them via `findByIntegrationId`. Never shown, filtered, or edited
 * by end users.
 *
 * See plans/dispatch/37e-quickbooks-invoice-sync.md §3 "Id map (D9)".
 */
export const quickbooksFields = defineFields([
  {
    appFieldKey: 'qboInvoiceId',
    type: 'TEXT',
    targetEntity: 'invoice',
    scope: 'connection',
    name: 'QuickBooks invoice ID',
    description: 'The QuickBooks Online Invoice.Id this Auxx invoice was pushed to.',
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
    appFieldKey: 'qboCustomerId',
    type: 'TEXT',
    targetEntity: 'contact',
    scope: 'connection',
    name: 'QuickBooks customer ID',
    description: 'The QuickBooks Online Customer.Id this contact is mapped to.',
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
    appFieldKey: 'qboItemId',
    type: 'TEXT',
    targetEntity: 'catalog_item',
    scope: 'connection',
    name: 'QuickBooks item ID',
    description: 'The QuickBooks Online Item.Id this catalog item is mapped to.',
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
