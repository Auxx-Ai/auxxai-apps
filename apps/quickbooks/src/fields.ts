// src/fields.ts

import { defineFields } from '@auxx/sdk/fields'

/**
 * Identity custom fields the QuickBooks app owns — one set per connected
 * QuickBooks company (`scope: 'connection'`).
 *
 * The invoice mirror (`qboInvoiceId` on `invoice`, `qboItemId` on
 * `catalog_item`) was retired on 2026-09-10 (platform brief 14, platform
 * PR #2100): `sync-invoice.ts` and `upsert-item.ts` are gone from the
 * platform and nothing reads or writes those two identity fields any more.
 * Do not re-add them without a new sync orchestrator to back them.
 *
 * The remaining fields:
 * - `qboCustomerId` (on `contact`) — written when Auxx creates the matching
 *   QuickBooks customer, so a re-push finds instead of duplicates.
 * - `qboAccountId` (on `gl_account`) — filled in by a person via the
 *   accounting setup wizard when they confirm an account pairing.
 * - `qboVendorId` (on `company`) — the counterparty id the accounting
 *   adapter resolves on an accounts-payable journal line (brief 13 §1,
 *   platform PR #2100): without it, a vendor line refuses to export with
 *   "has not been synced to QuickBooks yet."
 *
 * All are hidden, `identity: true` text fields — the platform mirrors
 * writes into `RecordIdentity` (`source:'quickbooks'`) and app code resolves
 * them via `findByIntegrationId`. Never shown, filtered, or edited by end
 * users.
 *
 * See plans/dispatch/37e-quickbooks-invoice-sync.md §3 "Id map (D9)".
 */
export const quickbooksFields = defineFields([
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
    key: 'qboVendorId',
    type: 'TEXT',
    targetEntity: 'company',
    scope: 'connection',
    name: 'QuickBooks vendor ID',
    description: 'The QuickBooks Online Vendor.Id this company is mapped to.',
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
    // Decision `G19`: the account map. This is the only one of the three that a
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
