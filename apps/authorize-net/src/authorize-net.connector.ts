// src/authorize-net.connector.ts

// One stream only: charges get none because the Shopify connector already writes
// `customer_transaction` for the same payment, and unsettled transactions belong to no
// deposit, so they stay a read tool (build plan §8 / §10.5).

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import {
  payoutFieldMappings,
  payoutSourceFields,
  processorFieldMappings,
} from '@auxx/sdk/financial-source'
import { z } from '@auxx/sdk/tools'
import authorizeNetSync, {
  AUTHORIZE_NET_DEFAULT_HISTORY_START,
} from './authorize-net.connector.server'

// Synthetic: no live probe has run, so the preview uses the vendor reference's examples.
const EXAMPLE_BATCH_ID = '10198080'
const EXAMPLE_TRANS_ID = '12345'
const EXAMPLE_ACCOUNT = {
  providerKey: 'authorize_net',
  externalAccountId: '565697',
  environment: 'live',
}
const EXAMPLE_RAW_BATCH = {
  batchId: EXAMPLE_BATCH_ID,
  settlementTimeUTC: '2026-01-05T18:48:19Z',
  settlementTimeLocal: '2026-01-05T13:48:19',
  settlementState: 'settledSuccessfully',
  paymentMethod: 'creditCard',
  statistics: [
    {
      accountType: 'Visa',
      chargeAmount: '2.00',
      chargeCount: 1,
      refundAmount: '0.00',
      refundCount: 0,
      voidCount: 0,
      declineCount: 0,
      errorCount: 0,
    },
  ],
}
const EXAMPLE_RAW_TRANSACTION = {
  transId: EXAMPLE_TRANS_ID,
  submitTimeUTC: '2026-01-05T09:00:00Z',
  submitTimeLocal: '2026-01-05T04:00:00',
  transactionStatus: 'settledSuccessfully',
  invoiceNumber: '3754',
  firstName: 'John',
  lastName: 'Doe',
  accountType: 'Visa',
  accountNumber: 'XXXX1111',
  amount: '2.00',
  settleAmount: '2.00',
}
const EXAMPLE_ENTRY = {
  id: EXAMPLE_TRANS_ID,
  type: 'charge',
  // The list surface names no `transactionType`, so the status stands in for it.
  providerType: 'settledSuccessfully',
  sourceReference: null,
  gross: '2.00',
  // A billed rail nets nothing on the wire — the acquirer bills monthly.
  fee: '0.00',
  net: '2.00',
  currency: 'USD',
  currencyExponent: 2,
  transactionDate: '2026-01-05T09:00:00Z',
  payoutId: EXAMPLE_BATCH_ID,
  sourceTransactionId: EXAMPLE_TRANS_ID,
  sourceOrderId: '3754',
  sourceId: null,
  sourceType: 'Visa',
  raw: EXAMPLE_RAW_TRANSACTION,
}

export const authorizeNetConnector = defineDataConnector({
  // `defineDataConnector` refuses an underscore; the providerKey in every `sourceKey`
  // stays `authorize_net`.
  id: 'authorizenet',
  label: 'Authorize.net',
  description:
    'Sync Authorize.net settled batches and the transactions that make them up, so each ' +
    'batch can be reconciled against the bank deposit it produced.',
  requiresConnection: true,
  iconKey: 'banknote',
  config: z.object({
    settlementHistoryStartDate: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/)
      .optional()
      .describe(
        `Settlement history start date (YYYY-MM-DD). Defaults to ${AUTHORIZE_NET_DEFAULT_HISTORY_START}.`
      ),
  }),
  streams: [
    // History is deliberately re-read to catch membership changes; identity is
    // `sourceKey`, so a second sync creates no duplicate rows.
    {
      key: 'payout',
      syncMode: 'incremental',
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
        externalId: EXAMPLE_BATCH_ID,
        sourceAccount: EXAMPLE_ACCOUNT,
        acquisition: { id: `scan:${EXAMPLE_BATCH_ID}`, startedAt: '2026-01-06T00:00:00Z' },
        payout: {
          id: EXAMPLE_BATCH_ID,
          // `settlementState` verbatim, `settlementError` included, so the platform's
          // assessment can refuse the batch rather than it vanishing.
          status: 'settledSuccessfully',
          // A sum of the per-brand statistics; the header states no total of its own
          // (build plan §3.4 item 1).
          amount: '2.00',
          currency: 'USD',
          currencyExponent: 2,
          issuedAt: '2026-01-05T18:48:19Z',
          issuedOn: '2026-01-05',
          // A batch names no bank account (build plan §3.4 item 3).
          destinationExternalId: null,
          raw: EXAMPLE_RAW_BATCH,
        },
        raw: EXAMPLE_RAW_BATCH,
        rejectionReason: null,
        membership: {
          page: {
            id: `scan:${EXAMPLE_BATCH_ID}:0`,
            index: 0,
            requestCursor: '1',
            nextCursor: null,
            terminal: true,
          },
          rawRows: [EXAMPLE_RAW_TRANSACTION],
          rejections: [],
          complete: true,
          providerReady: true,
          reason: null,
          entries: [EXAMPLE_ENTRY],
        },
      }),
    },
  ],
  execute: authorizeNetSync,
})
