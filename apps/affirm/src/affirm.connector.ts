// src/affirm.connector.ts

/**
 * The single Affirm data connector — two streams, no entities of its own.
 *
 * Affirm is a **financial source**, not an app that gets to design a record
 * model. The platform already has a finished contract for what a financial
 * source hands it, so every column below is either a native attribute on the
 * `payout` / `processor_balance_entry` kinds or a field the SDK's shared
 * mappings name. This app declares **NO `defineEntity`** — exactly like
 * Shopify, and deliberately: contributing into the native kinds is what makes
 * an Affirm deposit a `MoneyTransfer` the ledger already understands, instead
 * of a private table nothing reconciles against.
 *
 * | Stream | Source | Target |
 * | --- | --- | --- |
 * | `payout` | `/settlements/daily` | `payout`, + its members fanned onto `processor_balance_entry` |
 * | `balance_transaction` | `/settlements/events` | `processor_balance_entry`, standalone |
 *
 * Field lists are the SDK's `payoutFieldMappings` / `processorFieldMappings`
 * verbatim (`@auxx/sdk/financial-source`), so Affirm and Shopify Payments
 * cannot drift apart in what they emit. They are imported, never copied.
 *
 * ⚠️ **Charges get no stream.** `/transactions` is read by tools only. The
 * obvious target would be `customer_transaction`, but the Shopify connector
 * already writes that row for the same customer payment under a different
 * `sourceKey`, so an Affirm-sourced row would be a SECOND transaction for one
 * payment and `order_payment_source_count` would disagree with its own
 * children (build plan §8).
 *
 * ⚠️ Declaring an enabled `upsert` mapping into `payout` /
 * `processor_balance_entry` is exactly the condition under which
 * `assertLegacyPayoutIngestionOwner` refuses the legacy `PayoutSource` writer.
 * That is intended: the two paths are mutually exclusive by construction, and
 * this app registers no `PayoutSource` (build plan §5.3).
 */

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import {
  payoutFieldMappings,
  payoutSourceFields,
  processorFieldMappings,
  processorSourceFields,
} from '@auxx/sdk/financial-source'
import { z } from '@auxx/sdk/tools'
import affirmSync from './affirm.connector.server'

/**
 * The REAL 2026-09-15 deposit, so the catalog preview shows a true Affirm
 * payload rather than an invented one.
 *
 * Both rows below are VERBATIM public-API responses from the 2026-09-16 probe —
 * `GET /settlements/daily` and `GET /settlements/events`, integer minor units.
 *
 * `total_sales 374005 + total_fees -16075 = total_settled 357930`, exactly.
 * ⚠️ `transaction_fees: -30` is a component OF `fees`, not an addition to it,
 * and is deliberately absent from the arithmetic — see the long comment in
 * `settlement-evidence.ts`. Translated: `fee` becomes POSITIVE `160.75`, `net`
 * is the `3579.30` that hit the bank, and `gross` is DERIVED as `net + fee`.
 */
const EXAMPLE_DEPOSIT_ID = 'I5Y8PHAWWSSS2WJ'
const EXAMPLE_EVENT_ID = '53f9cad7-b293-4918-b7d4-6716c64e21de'
const EXAMPLE_ACCOUNT = {
  providerKey: 'affirm',
  externalAccountId: '07JVNWWI5PZM8L7Y',
  environment: 'live',
}
const EXAMPLE_RAW_SUMMARY = {
  id: 'a28fbb9b-2f7c-4880-a938-3ed6d32709d8',
  deposit_id: EXAMPLE_DEPOSIT_ID,
  date: '2026-09-15',
  total_sales: 374005,
  total_refunds: 0,
  total_fees: -16075,
  total_settled: 357930,
  currency: 'USD',
  account_last_four: '6670',
}
const EXAMPLE_RAW_EVENT = {
  id: EXAMPLE_EVENT_ID,
  deposit_id: EXAMPLE_DEPOSIT_ID,
  date: '2026-09-15',
  effective_date: '2026-09-14T19:28:14Z',
  charge_created_date: '2026-09-14',
  order_id: 'rPhjzMna9vESRYlOF0hLADbBL',
  transaction_id: 'oTzSBZG2TU5WGc28',
  transaction_event_id: 'DUUX0OUUPNABFT9G',
  purchase_id: 'CPDZ-ANRU',
  merchant_id: '07JVNWWI5PZM8L7Y',
  initiating_merchant_id: '07JVNWWI5PZM8L7Y',
  channel: 'Affirm Direct',
  event_type: 'loan_capture',
  sales: 374005,
  refunds: 0,
  fees: -16075,
  transaction_fees: -30,
  original_loan_amount: 374005,
  total_settled: 357930,
  mdr: 0.0429,
  currency: 'USD',
}
const EXAMPLE_ENTRY = {
  id: EXAMPLE_EVENT_ID,
  type: 'charge',
  // ✔ The PUBLIC API emits `loan_capture`, the spelling its own reference
  // documents; the merchant portal's report says `loan_captured`. Both are
  // accepted, and this is what the API actually returned.
  providerType: 'loan_capture',
  sourceReference: null,
  gross: '3740.05',
  fee: '160.75',
  net: '3579.30',
  currency: 'USD',
  currencyExponent: 2,
  // `effective_date`, the capture's own occurrence time — not the settlement
  // `date`, which is date-only and lives on the header's `issuedOn`.
  transactionDate: '2026-09-14T19:28:14Z',
  payoutId: EXAMPLE_DEPOSIT_ID,
  sourceTransactionId: 'oTzSBZG2TU5WGc28',
  // Affirm's `order_id` IS the Shopify PaymentSession id, verbatim.
  sourceOrderId: 'rPhjzMna9vESRYlOF0hLADbBL',
  sourceId: 'CPDZ-ANRU',
  sourceType: null,
  raw: EXAMPLE_RAW_EVENT,
}

export const affirmConnector = defineDataConnector({
  id: 'affirm',
  label: 'Affirm',
  description:
    'Sync Affirm settlement deposits and the settlement events that make them up, so each ' +
    'weekly deposit_id can be reconciled against the bank line it produced.',
  requiresConnection: true,
  iconKey: 'banknote',
  config: z.object({}),
  streams: [
    // No `since`: every run re-reads from the history floor to catch membership and
    // lifecycle changes; identity is `sourceKey`, so a second sync creates no duplicates.
    {
      key: 'payout',
      // The settlement date; Affirm sends no settlement timestamp (`issuedAt` is null).
      query: { period: 'issuedOn' },
      mappings: [
        {
          rootPath: '',
          target: { entityKind: 'payout' },
          fields: payoutFieldMappings,
        },
        {
          rootPath: 'processorTransactions[]',
          target: { entityKind: 'processor_balance_entry' },
          relationshipFieldKey: 'system:payout_processor_entries',
          fields: processorFieldMappings,
        },
      ],
      exampleRecord: payoutSourceFields({
        externalId: EXAMPLE_DEPOSIT_ID,
        sourceAccount: EXAMPLE_ACCOUNT,
        acquisition: {
          id: `scan:${EXAMPLE_DEPOSIT_ID}`,
          startedAt: '2026-09-15T00:00:00Z',
        },
        payout: {
          id: EXAMPLE_DEPOSIT_ID,
          // Affirm states only the negative outcome, via `removal_state`.
          status: 'paid',
          amount: '3579.30',
          currency: 'USD',
          currencyExponent: 2,
          // Affirm dates a settlement, it does not timestamp it.
          issuedAt: null,
          issuedOn: '2026-09-15',
          // `account_last_four`. ✔ The public API sends it (the portal's
          // settlement JSON did not), so this is a real bank reconciliation
          // key — alongside `deposit_id` itself, *"the ID that a user sees on
          // their bank statement"*, which is more than Shopify Payments offers.
          destinationExternalId: '6670',
          raw: EXAMPLE_RAW_SUMMARY,
        },
        raw: EXAMPLE_RAW_SUMMARY,
        rejectionReason: null,
        membership: {
          page: {
            id: `scan:${EXAMPLE_DEPOSIT_ID}:0`,
            index: 0,
            requestCursor: null,
            nextCursor: null,
            terminal: true,
          },
          rawRows: [EXAMPLE_RAW_EVENT],
          rejections: [],
          // Only a fully paged widened window may claim this.
          complete: true,
          providerReady: true,
          reason: null,
          entries: [EXAMPLE_ENTRY],
        },
      }),
    },
    // The flat event feed, standalone. Events with NO `deposit_id` are real and
    // are emitted here with `payoutId: null` — the contract tolerates it.
    {
      key: 'balance_transaction',
      query: { period: 'transactionDate' },
      mappings: [
        {
          rootPath: '',
          target: { entityKind: 'processor_balance_entry' },
          fields: processorFieldMappings,
        },
      ],
      exampleRecord: processorSourceFields({
        externalId: EXAMPLE_EVENT_ID,
        sourceAccount: EXAMPLE_ACCOUNT,
        acquisition: { id: 'scan', startedAt: '2026-09-15T00:00:00Z' },
        page: { id: 'scan:0', index: 0, rowIndex: 0 },
        entry: EXAMPLE_ENTRY,
        raw: EXAMPLE_RAW_EVENT,
        rejectionReason: null,
      }),
    },
  ],
  execute: affirmSync,
})
