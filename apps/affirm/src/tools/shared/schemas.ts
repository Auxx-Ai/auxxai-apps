// src/tools/shared/schemas.ts

/**
 * Output schemas and example outputs shared by the app's tools — the four
 * reads, and (below) the three writes of build plan §7.
 *
 * Every READ example below is the REAL 2026-09-15 deposit (`I5Y8PHAWWSSS2WJ`,
 * `$3,579.30`, charge `CPDZ-ANRU`), so an eval autofill or a docs page shows a
 * true Affirm payload. The settlement-event example is now the live public-API
 * row from the 2026-09-16 probe, `id` included; `243EYFJGASKXX8BN` below is a
 * different object — the `auth` event on the same charge, from `/transactions`.
 *
 * ⚠️ The three WRITE examples are the exception and are SYNTHETIC — there is no
 * sandbox, so no capture, refund or void response has ever been observed. They
 * are labelled at point of use.
 *
 * No example carries a customer name, email or address, and no schema has a
 * field that could hold one. An expanded Affirm checkout is full of them.
 */

import { z } from '@auxx/sdk/tools'

/** One `/settlements/daily` row. */
export const settlementSchema = z.object({
  depositId: z
    .string()
    .describe('The id the merchant sees on their bank statement, e.g. I5Y8PHAWWSSS2WJ.'),
  date: z.string().describe('Settlement date, YYYY-MM-DD.'),
  status: z
    .string()
    .describe("'paid', or Affirm's removal_state verbatim when the money did not move."),
  totalSettled: z.string().describe('Exact decimal. The amount that reached the bank.'),
  currency: z.string(),
  currencyExponent: z.number(),
  accountLastFour: z.string().nullable(),
  reportedSales: z.string().nullable().describe("Affirm's own sales figure, exact decimal."),
  reportedRefunds: z.string().nullable(),
  reportedFees: z
    .string()
    .nullable()
    .describe('Affirm reports fees NEGATIVE. Quote the sign as given.'),
})

export const exampleSettlement = {
  depositId: 'I5Y8PHAWWSSS2WJ',
  date: '2026-09-15',
  status: 'paid',
  totalSettled: '3579.30',
  currency: 'USD',
  currencyExponent: 2,
  accountLastFour: '6670',
  reportedSales: '3740.05',
  reportedRefunds: '0.00',
  reportedFees: '-160.75',
}

/** One `/settlements/events` row. */
export const settlementEventSchema = z.object({
  id: z.string(),
  depositId: z
    .string()
    .nullable()
    .describe('Null is normal: not every settlement event belongs to a deposit.'),
  date: z.string().nullable(),
  type: z
    .string()
    .describe(
      'Platform activity kind: charge, refund, fee, adjustment, outgoing_transfer, ' +
        "returned_transfer, or unknown. 'unknown' means Affirm sent an event type we do not " +
        'map — report it rather than guessing.'
    ),
  providerType: z.string().describe("Affirm's own event_type, e.g. loan_capture."),
  gross: z.string().describe('Exact decimal. gross - fee === net.'),
  fee: z.string().describe('POSITIVE, unlike the negative figures Affirm reports.'),
  net: z.string(),
  currency: z.string(),
  orderId: z
    .string()
    .nullable()
    .describe("Affirm's order_id verbatim — the Shopify PaymentSession id for this merchant."),
  transactionId: z.string().nullable(),
  sourceId: z.string().nullable(),
})

export const exampleSettlementEvent = {
  id: '53f9cad7-b293-4918-b7d4-6716c64e21de',
  depositId: 'I5Y8PHAWWSSS2WJ',
  // `effective_date`, the capture's own occurrence time. The settlement date
  // (`2026-09-15`) is the deposit's, and lives on the settlement row.
  date: '2026-09-14T19:28:14Z',
  type: 'charge',
  providerType: 'loan_capture',
  gross: '3740.05',
  fee: '160.75',
  net: '3579.30',
  currency: 'USD',
  orderId: 'rPhjzMna9vESRYlOF0hLADbBL',
  transactionId: 'oTzSBZG2TU5WGc28',
  sourceId: 'CPDZ-ANRU',
}

/** A charge summary. No customer identity. */
export const chargeSchema = z.object({
  id: z.string().describe('The Affirm charge ARI, e.g. CPDZ-ANRU.'),
  orderId: z.string().nullable(),
  status: z.string().nullable().describe('e.g. captured, authorized, voided.'),
  amount: z.string().describe('Exact decimal.'),
  amountRefunded: z.string().nullable(),
  currency: z.string(),
  created: z.string().nullable(),
  authorizationExpiration: z.string().nullable(),
  checkoutId: z.string().nullable(),
  eventCount: z.number(),
})

export const exampleCharge = {
  id: 'CPDZ-ANRU',
  orderId: 'rPhjzMna9vESRYlOF0hLADbBL',
  status: 'captured',
  amount: '3740.05',
  amountRefunded: null,
  currency: 'USD',
  created: '2026-09-14T19:28:12Z',
  authorizationExpiration: null,
  checkoutId: 'HZN3BCP2ZTFZK6T7',
  eventCount: 1,
}

/** A single charge, with its events and the checkout metadata. Still no PII. */
export const chargeDetailSchema = chargeSchema.extend({
  events: z.array(
    z.object({
      id: z.string().nullable(),
      type: z.string().nullable().describe('e.g. auth, capture, refund.'),
      amount: z.string().nullable(),
      created: z.string().nullable(),
    })
  ),
  shopifyPaymentSessionId: z
    .string()
    .nullable()
    .describe(
      'checkout.metadata.transaction_id verbatim, e.g. ' +
        'gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL. This is how an Affirm charge ' +
        'is tied back to its Shopify order when the settlement order_id does not match.'
    ),
  platformType: z.string().nullable().describe('e.g. Shopify.'),
  checkoutOrderId: z
    .string()
    .nullable()
    .describe('Should equal orderId. A mismatch is a finding worth reporting, not smoothing over.'),
})

export const exampleChargeDetail = {
  ...exampleCharge,
  events: [
    { id: '243EYFJGASKXX8BN', type: 'auth', amount: '3740.05', created: '2026-09-14T19:28:12Z' },
  ],
  shopifyPaymentSessionId: 'gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL',
  platformType: 'Shopify',
  checkoutOrderId: 'rPhjzMna9vESRYlOF0hLADbBL',
}

// ============================================================
// Writes — build plan §7
//
// ⚠️ Every example below is SYNTHETIC and labelled as such. No write has ever
// been issued against this account: it has production keys and no sandbox, so
// there is no observed response to copy. The SHAPE is the documented one from
// docs.affirm.com (capture / refund return `type, currency, created, amount,
// fee, id`; void returns `type, created, id`); the VALUES are invented and
// derived from the real Sep-15 charge so the numbers at least hang together.
// ============================================================

/**
 * The sentence every write tool's result ends with, and the single place it is
 * written.
 *
 * A write issued here reaches Affirm and NOTHING ELSE. Shopify is the system of
 * record for the order, it is not told, and it can issue its own refund against
 * the same charge. Putting this on the RESULT — not only in the tool
 * description — is deliberate: the description is read once, at grant time, and
 * the result is what an operator is looking at when they decide what to do next.
 */
export const SHOPIFY_NOT_TOLD =
  'This reached Affirm ONLY. Shopify was not told and its record of this order is unchanged — ' +
  'a refunded charge still reads as unrefunded there. Reconcile it in Shopify by hand, and do ' +
  'not let Shopify issue its own refund against the same charge.'

/**
 * The response to a capture, refund or void. Every member is nullable: by the
 * time this is built the money has already moved, so an unreadable field is
 * reported as absent rather than turned into a failure the operator might
 * respond to by trying again.
 */
export const writeEventSchema = z.object({
  id: z.string().nullable().describe('Affirm’s transaction-event id for what just happened.'),
  type: z.string().nullable().describe('Affirm’s own event type: capture, refund or void.'),
  created: z.string().nullable().describe('RFC 3339 timestamp.'),
  currency: z.string().nullable().describe('Null on a void, which reports no amount.'),
  amount: z.string().nullable().describe('Exact decimal string, converted from minor units.'),
  amountMinor: z
    .number()
    .nullable()
    .describe('Affirm’s own integer MINOR UNITS (cents), unconverted. Reconcile against this.'),
  fee: z.string().nullable().describe('Exact decimal string.'),
  feeMinor: z
    .number()
    .nullable()
    .describe(
      'The merchant fee on this event, in minor units. On a REFUND the returned amount ' +
        'already INCLUDES any refunded fee — the two are reported separately and are ' +
        'deliberately not netted here.'
    ),
})

/** The fields every write tool returns alongside its event. */
export const writeResultSchema = z.object({
  summary: z
    .string()
    .describe('Readable rollup. Safe to quote directly. Says what was NOT done, as well.'),
  chargeId: z.string().describe('The Affirm charge this was issued against.'),
  event: writeEventSchema,
  requestedAmountMinor: z
    .number()
    .nullable()
    .describe(
      'The minor-unit amount that was ASKED for, or null when none was sent. Compare it ' +
        'against event.amountMinor: they can legitimately differ.'
    ),
  referenceId: z
    .string()
    .nullable()
    .describe('The reference_id sent to Affirm, or null when none was supplied.'),
  idempotencyKey: z
    .string()
    .describe(
      'The Idempotency-Key this request carried. Derived from the operation, merchant, ' +
        'charge, amount and reference_id — so re-issuing the SAME logical request reuses it ' +
        'and Affirm processes it once. A different key is a different operation.'
    ),
  shopifyNotice: z
    .string()
    .describe('Standing warning that Shopify was not told. Always present. Always relay it.'),
})

/** ⚠️ SYNTHETIC. A full capture of the real Sep-15 charge. */
export const exampleCaptureResult = {
  summary:
    'Captured Affirm charge CPDZ-ANRU: 3740.05 USD, fee 160.45, Affirm event NNRQ-3QBV at ' +
    `2026-09-15T16:04:11Z. This was a FULL capture — no amount was sent. ${SHOPIFY_NOT_TOLD}`,
  chargeId: 'CPDZ-ANRU',
  event: {
    id: 'NNRQ-3QBV',
    type: 'capture',
    created: '2026-09-15T16:04:11Z',
    currency: 'USD',
    amount: '3740.05',
    amountMinor: 374005,
    fee: '160.45',
    feeMinor: 16045,
  },
  requestedAmountMinor: null,
  referenceId: null,
  idempotencyKey: 'auxx-capture-f2650adf49bc85acbbe5442293923a35486a1fd2cf9efba2c58574db8a0c1f74',
  shopifyNotice: SHOPIFY_NOT_TOLD,
}

/** ⚠️ SYNTHETIC. A 25.00 partial refund; the returned amount carries a refunded fee. */
export const exampleRefundResult = {
  summary:
    'Refunded Affirm charge CPDZ-ANRU: 2500 minor units were requested, Affirm returned ' +
    '26.07 USD including a refunded fee of 1.07 — the returned amount ALREADY INCLUDES it, do ' +
    'not subtract it again. Affirm event RFND-7K2Q at 2026-09-15T17:22:05Z. The returned amount ' +
    `differs from the requested amount; report both rather than picking one. ${SHOPIFY_NOT_TOLD}`,
  chargeId: 'CPDZ-ANRU',
  event: {
    id: 'RFND-7K2Q',
    type: 'refund',
    created: '2026-09-15T17:22:05Z',
    currency: 'USD',
    amount: '26.07',
    amountMinor: 2607,
    fee: '1.07',
    feeMinor: 107,
  },
  requestedAmountMinor: 2500,
  referenceId: 'rma-4182',
  idempotencyKey: 'auxx-refund-8183f7ce7643649578f123c87490e069518dee6fef43ee116cb3aab09a7e8ffb',
  shopifyNotice: SHOPIFY_NOT_TOLD,
}

/** ⚠️ SYNTHETIC. A void reports no amount at all — hence the nulls. */
export const exampleVoidResult = {
  summary:
    'Voided Affirm charge CPDZ-ANRU. Affirm event VOID-2M8T at 2026-09-15T15:10:44Z. This was a ' +
    'FULL void — no amount was sent. Affirm reports no amount on a void; read the charge with ' +
    `get_affirm_charge to see what was cancelled. ${SHOPIFY_NOT_TOLD}`,
  chargeId: 'CPDZ-ANRU',
  event: {
    id: 'VOID-2M8T',
    type: 'void',
    created: '2026-09-15T15:10:44Z',
    currency: null,
    amount: null,
    amountMinor: null,
    fee: null,
    feeMinor: null,
  },
  requestedAmountMinor: null,
  referenceId: null,
  idempotencyKey: 'auxx-void-0df4edbfe0960df77cece50ce08361d5e79d428607a8722aca277afb601db20c',
  shopifyNotice: SHOPIFY_NOT_TOLD,
}
