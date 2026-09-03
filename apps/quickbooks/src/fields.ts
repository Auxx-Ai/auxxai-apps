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
    key: 'qboInvoiceId',
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
    key: 'qboCustomerId',
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
    key: 'qboItemId',
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
  {
    // Decision `G19`: the account map. This is the only one of the four that a
    // PERSON fills in rather than the sync writing as a side effect of a push —
    // `qboCustomerId` and friends are recorded when Auxx creates the record in
    // QuickBooks, but nothing creates an account, so this cell is written by the
    // accounting setup wizard when a human confirms a pairing.
    //
    // That is also why the cell IS the confirmation. `G19` requires a suggested
    // match to read differently from a confirmed one; because the matcher never
    // writes and only the wizard does, a populated cell means a person agreed,
    // and no `source`/`confirmedAt` columns are needed to say so.
    //
    // `scope: 'connection'` matters more here than anywhere else in this file:
    // an account id is meaningless against a different QuickBooks company, so
    // reconnecting to another realm must not inherit the old company's map.
    key: 'qboAccountId',
    type: 'TEXT',
    targetEntity: 'gl_account',
    scope: 'connection',
    name: 'QuickBooks account ID',
    description: 'The QuickBooks Online Account.Id this Auxx GL account is mapped to.',
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
