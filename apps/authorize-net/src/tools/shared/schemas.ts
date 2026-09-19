// src/tools/shared/schemas.ts

// No live probe has run; every example is the vendor reference's own sample values. No
// schema has a field that could hold a customer name, email or address.

import { z } from '@auxx/sdk/tools'

/** Per-card-brand statistics on one settled batch. */
export const batchBrandSchema = z.object({
  accountType: z.string().describe('Visa, Mastercard, AmericanExpress, Discover, eCheck, …'),
  chargeAmount: z.string().nullable().describe('Exact decimal, as Authorize.net states it.'),
  chargeCount: z.number(),
  refundAmount: z.string().nullable(),
  refundCount: z.number(),
  returnedItemAmount: z.string().nullable().describe('eCheck returns. Null when not reported.'),
  returnedItemCount: z.number(),
  chargebackAmount: z.string().nullable(),
  chargebackCount: z.number(),
  voidCount: z.number(),
  declineCount: z.number(),
  errorCount: z.number(),
})

/** One `getSettledBatchList` row. */
export const batchSchema = z.object({
  batchId: z.string(),
  settledAt: z.string().describe('settlementTimeUTC verbatim.'),
  settledOn: z.string().describe('Settlement date, YYYY-MM-DD, taken from settlementTimeUTC.'),
  state: z.string().describe('settlementState, e.g. settledSuccessfully or settlementError.'),
  paymentMethod: z.string().nullable().describe('creditCard or eCheck.'),
  netAmount: z
    .string()
    .describe(
      'Exact decimal. The SUM over card brands of chargeAmount − refundAmount − ' +
        'returnedItemAmount − chargebackAmount. Authorize.net states no single batch total; ' +
        'this is the only figure there is, and it carries NO fee — the acquirer bills card ' +
        'fees on a monthly statement.'
    ),
  currency: z.string().describe('The merchant account currency. Not stated per batch.'),
  perBrand: z.array(batchBrandSchema).describe('Empty when statistics were not requested.'),
})

export const exampleBatch = {
  batchId: '10198080',
  settledAt: '2014-10-24T18:48:19Z',
  settledOn: '2014-10-24',
  state: 'settledSuccessfully',
  paymentMethod: 'eCheck',
  netAmount: '12.22',
  currency: 'USD',
  perBrand: [
    {
      accountType: 'eCheck',
      chargeAmount: '12.22',
      chargeCount: 1,
      refundAmount: '0',
      refundCount: 0,
      returnedItemAmount: '0',
      returnedItemCount: 0,
      chargebackAmount: '0',
      chargebackCount: 0,
      voidCount: 0,
      declineCount: 0,
      errorCount: 0,
    },
  ],
}

/** One `getTransactionList` row inside a batch. */
export const batchTransactionSchema = z.object({
  transId: z.string(),
  submittedAt: z.string().describe('submitTimeUTC verbatim.'),
  status: z.string().describe('e.g. settledSuccessfully, refundSettledSuccessfully, declined.'),
  amount: z
    .string()
    .nullable()
    .describe('settleAmount when present, else amount. Exact decimal, no fee deducted.'),
  currency: z.string(),
  invoiceNumber: z.string().nullable().describe('For a Shopify sale, usually the order number.'),
  accountType: z.string().nullable(),
  accountNumber: z.string().nullable().describe('Masked by Authorize.net, e.g. XXXX1111.'),
  hasReturnedItems: z.boolean().nullable(),
})

export const exampleBatchTransaction = {
  transId: '12345',
  submittedAt: '2009-05-30T09:00:00',
  status: 'settledSuccessfully',
  amount: '2.00',
  currency: 'USD',
  invoiceNumber: 'INV00001',
  accountType: 'Visa',
  accountNumber: 'XXXX1111',
  hasReturnedItems: null,
}

/** One `getTransactionDetails` response, minus every customer-identifying field. */
export const transactionDetailSchema = z.object({
  transId: z.string(),
  type: z.string().describe('transactionType, e.g. authCaptureTransaction, refundTransaction.'),
  status: z.string(),
  submittedAt: z.string(),
  authAmount: z.string().nullable(),
  settleAmount: z.string().nullable().describe('What actually settled. Exact decimal.'),
  currency: z.string(),
  authCode: z.string().nullable(),
  refTransId: z
    .string()
    .nullable()
    .describe('The original transaction a refund or void points at.'),
  networkTransId: z.string().nullable(),
  batchId: z.string().nullable().describe('Null while the transaction is still unsettled.'),
  batchSettledAt: z.string().nullable(),
  batchState: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  description: z.string().nullable(),
  purchaseOrderNumber: z.string().nullable(),
  cardType: z.string().nullable(),
  cardNumber: z.string().nullable().describe('Masked by Authorize.net, e.g. XXXX1111.'),
})

export const exampleTransactionDetail = {
  transId: '12345',
  type: 'authOnlyTransaction',
  status: 'settledSuccessfully',
  submittedAt: '2010-08-30T17:49:20.757Z',
  authAmount: '2.00',
  settleAmount: '2.00',
  currency: 'USD',
  authCode: '000000',
  refTransId: '12345',
  networkTransId: '123456789KLNLN9H',
  batchId: '12345',
  batchSettledAt: '2010-08-30T17:49:20.757Z',
  batchState: 'settledSuccessfully',
  invoiceNumber: 'INV00001',
  description: 'some description',
  purchaseOrderNumber: 'PO000001',
  cardType: 'Visa',
  cardNumber: 'XXXX1111',
}

/** One `getUnsettledTransactionList` row — captured, not yet batched. */
export const unsettledTransactionSchema = batchTransactionSchema.extend({
  marketType: z.string().nullable(),
  product: z.string().nullable(),
})

export const exampleUnsettledTransaction = {
  transId: '2149186960',
  submittedAt: '2017-06-16T06:48:37Z',
  status: 'capturedPendingSettlement',
  amount: '5',
  currency: 'USD',
  invoiceNumber: null,
  accountType: 'Mastercard',
  accountNumber: 'XXXX0015',
  hasReturnedItems: null,
  marketType: 'eCommerce',
  product: 'Card Not Present',
}
