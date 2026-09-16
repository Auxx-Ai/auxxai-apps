// src/blocks/affirm/affirm-schema.ts

/**
 * The `affirm` block schema: its operation surface, its inputs, and the output
 * variables each operation publishes.
 *
 * Four READ operations across two resources, and they are the same four read
 * tools the agent surface already has (`src/tools/`). The block adds no fetching
 * and no projection of its own — `affirm.server.ts` dispatches through
 * `affirm-tool-map.ts` into `ctx.runTool`, so a workflow node and an agent can
 * never disagree about what Affirm said.
 *
 * Capture, refund and void are deliberately absent. Build plan §7: this account
 * has production keys and NO sandbox, Shopify's own refund path can refund the
 * same charge, and who owns a refund has to be decided before a second writer
 * exists. Whether those ever become block operations is its own decision.
 *
 * ## Input naming
 *
 * Every resource's inputs are merged into ONE flat `inputs` object, so keys are
 * namespaced `<resource><Operation><Field>` — e.g. `settlementGetEventsDepositId`.
 *
 * `chargeId` is the ONE deliberate exception. It is the only required input in
 * the whole block, and the platform's own block validation checks required TOOL
 * input names against the node config (`app-manifests.ts` step 2). Naming it
 * `chargeGetChargeId` would put a permanent, false "chargeId is required and is
 * empty" warning on every `charge.get` node. It is unique across all four
 * operations, so the prefix buys nothing and costs that.
 *
 * ## Amounts
 *
 * Every money value below is an exact decimal STRING, never a number. Affirm's
 * settlement API is integer minor units end to end (✔ probe 2026-09-16); the
 * tools convert with integer/string arithmetic at the currency's own exponent,
 * and nothing here divides by 100 or re-parses. A downstream node that needs a
 * number should be given the string and convert deliberately.
 */

import { type WorkflowSchema, Workflow } from '@auxx/sdk'

/** The block's resource picker. */
export const RESOURCES = [
  { value: 'settlement', label: 'Settlement' },
  { value: 'charge', label: 'Charge' },
] as const

/**
 * Operations per resource. The SINGLE source of the surface: `VALID_OPERATIONS`
 * is derived from it, and `affirm-tool-map.ts` is asserted against it in
 * `tests/affirm-block.test.ts`, so a resource cannot advertise an operation the
 * dispatcher does not know about.
 */
export const OPERATIONS_ALL = {
  settlement: [
    { value: 'getMany', label: 'List Deposits' },
    { value: 'getEvents', label: 'List Deposit Events' },
  ],
  charge: [
    { value: 'getMany', label: 'List Charges' },
    { value: 'get', label: 'Get Charge' },
  ],
} as const

/** Operation options per resource; the panel narrows the flat union with these. */
export const OPERATIONS = OPERATIONS_ALL as unknown as Record<
  string,
  { value: string; label: string }[]
>

/**
 * The flat union the schema's `operation` select advertises. A `Workflow.select`
 * takes one option list, so `getMany` carries a resource-neutral label here and
 * the specific one ("List Deposits" / "List Charges") comes from {@link OPERATIONS}.
 */
export const ALL_OPERATIONS = [
  { value: 'getMany', label: 'List' },
  { value: 'getEvents', label: 'List Deposit Events' },
  { value: 'get', label: 'Get' },
] as const

/** Structural validity: does this `resource.operation` pair exist? Derived. */
export const VALID_OPERATIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(OPERATIONS).map(([resource, ops]) => [resource, ops.map((op) => op.value)])
)

/**
 * Page-size ceilings, mirroring the zod caps on the tools this block dispatches
 * to (`list_affirm_settlements` / `list_affirm_settlement_events`: 250;
 * `list_affirm_charges`: 200). Held as local numbers rather than imported from
 * `tools/shared/settlements.ts`, because this file is in the CLIENT bundle and
 * that module reaches the Affirm HTTP client — a whole fetch layer shipped to the
 * canvas for one integer. `tests/affirm-block.test.ts` pins both values.
 */
const SETTLEMENT_PAGE_LIMIT = 250
const CHARGE_PAGE_LIMIT = 200

export const affirmInputs = {
  // ── Settlement: List Deposits ───────────────────────────────────────────
  settlementGetManyAfter: Workflow.date({
    label: 'From settlement date',
    description: 'Earliest settlement date, YYYY-MM-DD. For example 2026-09-15.',
    acceptsVariables: true,
  }),
  settlementGetManyBefore: Workflow.date({
    label: 'To settlement date',
    description: 'Latest settlement date, YYYY-MM-DD.',
    acceptsVariables: true,
  }),
  settlementGetManyLimit: Workflow.number({
    label: 'Deposits per page',
    description: `Rows to request. Up to ${SETTLEMENT_PAGE_LIMIT}; leave blank for the maximum.`,
    integer: true,
    min: 1,
    max: SETTLEMENT_PAGE_LIMIT,
    acceptsVariables: true,
  }),
  settlementGetManyCursor: Workflow.string({
    label: 'Cursor',
    description:
      "The nextCursor from a previous run, to read the following page. Affirm's own resume token.",
    acceptsVariables: true,
  }),

  // ── Settlement: List Deposit Events ─────────────────────────────────────
  settlementGetEventsDepositId: Workflow.string({
    label: 'Deposit ID',
    description:
      'Keep only events for this deposit_id — the id the merchant sees on the bank statement, ' +
      'e.g. I5Y8PHAWWSSS2WJ. Affirm offers NO deposit filter on this feed, so the date window ' +
      'is read and this is applied locally: the result is the complete membership of the ' +
      'deposit only when the "complete" output is true.',
    placeholder: 'I5Y8PHAWWSSS2WJ',
    acceptsVariables: true,
  }),
  settlementGetEventsAfter: Workflow.date({
    label: 'From date',
    description:
      'Earliest event date, YYYY-MM-DD. With a deposit ID and no "to" date this is taken as the ' +
      "settlement date and widened by a day either side, because a deposit's date and its " +
      "events' dates diverge.",
    acceptsVariables: true,
  }),
  settlementGetEventsBefore: Workflow.date({
    label: 'To date',
    description: 'Latest event date, YYYY-MM-DD.',
    acceptsVariables: true,
  }),
  settlementGetEventsLimit: Workflow.number({
    label: 'Events per page',
    description: `Rows to request. Up to ${SETTLEMENT_PAGE_LIMIT}; leave blank for the maximum.`,
    integer: true,
    min: 1,
    max: SETTLEMENT_PAGE_LIMIT,
    acceptsVariables: true,
  }),
  settlementGetEventsCursor: Workflow.string({
    label: 'Cursor',
    description: 'The nextCursor from a previous run, to read the following page.',
    acceptsVariables: true,
  }),

  // ── Charge: List Charges ────────────────────────────────────────────────
  chargeGetManyAfter: Workflow.datetime({
    label: 'Created after',
    description: 'Earliest charge creation time, ISO-8601. For example 2026-09-01T00:00:00Z.',
    acceptsVariables: true,
  }),
  chargeGetManyBefore: Workflow.datetime({
    label: 'Created before',
    description: 'Latest charge creation time, ISO-8601.',
    acceptsVariables: true,
  }),
  chargeGetManyOrderId: Workflow.string({
    label: 'Order ID',
    description:
      'Keep only charges with this order_id — for this merchant, the Shopify PaymentSession id ' +
      'without its gid prefix, e.g. rPhjzMna9vESRYlOF0hLADbBL. Filtered locally, so it only ' +
      'finds charges inside the requested date range.',
    placeholder: 'rPhjzMna9vESRYlOF0hLADbBL',
    acceptsVariables: true,
  }),
  chargeGetManyLimit: Workflow.number({
    label: 'Charges per page',
    description: `Rows to request from Affirm. Up to ${CHARGE_PAGE_LIMIT}.`,
    integer: true,
    min: 1,
    max: CHARGE_PAGE_LIMIT,
    acceptsVariables: true,
  }),

  // ── Charge: Get Charge ──────────────────────────────────────────────────
  // Unprefixed on purpose — see the file header.
  chargeId: Workflow.string({
    label: 'Charge ID',
    description:
      'The Affirm charge ARI, e.g. CPDZ-ANRU. Bind this from an upstream settlement ' +
      "event's sourceId.",
    placeholder: 'CPDZ-ANRU',
    acceptsVariables: true,
    required: true,
  }),
}

/** One `/settlements/daily` row, as the tool projects it. */
const settlementFields = {
  depositId: Workflow.string(),
  date: Workflow.date(),
  status: Workflow.string(),
  totalSettled: Workflow.string(),
  currency: Workflow.string(),
  currencyExponent: Workflow.number({ integer: true }),
  accountLastFour: Workflow.string(),
  reportedSales: Workflow.string(),
  reportedRefunds: Workflow.string(),
  reportedFees: Workflow.string(),
}

/**
 * One `/settlements/events` row.
 *
 * `fee` is POSITIVE here and `gross - fee === net`, which is the platform's
 * contract — Affirm's own feed reports fees negative, and `reportedFees` on the
 * deposit above keeps that sign. The two disagree on purpose; do not reconcile
 * them in a workflow.
 *
 * `date` is the event's `effective_date` (a real occurrence timestamp), NOT the
 * deposit's date-only settlement date, which stays on the settlement row.
 */
const settlementEventFields = {
  id: Workflow.string(),
  depositId: Workflow.string(),
  date: Workflow.datetime(),
  type: Workflow.string(),
  providerType: Workflow.string(),
  gross: Workflow.string(),
  fee: Workflow.string(),
  net: Workflow.string(),
  currency: Workflow.string(),
  orderId: Workflow.string(),
  transactionId: Workflow.string(),
  sourceId: Workflow.string(),
}

/** A charge summary. No customer name, email or address, by construction. */
const chargeFields = {
  id: Workflow.string(),
  orderId: Workflow.string(),
  status: Workflow.string(),
  amount: Workflow.string(),
  amountRefunded: Workflow.string(),
  currency: Workflow.string(),
  created: Workflow.datetime(),
  authorizationExpiration: Workflow.datetime(),
  checkoutId: Workflow.string(),
  eventCount: Workflow.number({ integer: true }),
}

/** A single charge's fields, plus what the expanded checkout is allowed to add. */
const chargeDetailFields = {
  ...chargeFields,
  platformType: Workflow.string(),
  checkoutOrderId: Workflow.string(),
}

/** One event on a charge: `auth`, `capture`, `refund`. */
const chargeEventFields = {
  id: Workflow.string(),
  type: Workflow.string(),
  amount: Workflow.string(),
  created: Workflow.datetime(),
}

/**
 * The variables each operation publishes downstream.
 *
 * Dispatched per operation rather than unioned, so a node offers the variables
 * that operation actually produces. These names are the dispatched tool's own
 * output keys — `affirm.server.ts` adds a count and, for `charge.get`, nests the
 * charge; it renames nothing.
 */
export function affirmComputeOutputs(resource: string, operation: string) {
  if (resource === 'settlement' && operation === 'getMany') {
    return {
      summary: Workflow.string({ label: 'summary' }),
      settlements: Workflow.array({
        label: 'settlements',
        items: Workflow.struct(settlementFields, { label: 'settlement' }),
      }),
      // Deliberately no summed total across deposits. A deposit is transcribed,
      // never derived — build plan §3.4 rule 3 — and a workflow that adds up a
      // page of them has invented a figure Affirm never stated.
      settlementCount: Workflow.number({ label: 'settlementCount', integer: true }),
      rejected: Workflow.number({ label: 'rejected', integer: true }),
      nextCursor: Workflow.string({ label: 'nextCursor' }),
      hasMore: Workflow.boolean({ label: 'hasMore' }),
    }
  }

  if (resource === 'settlement' && operation === 'getEvents') {
    return {
      summary: Workflow.string({ label: 'summary' }),
      events: Workflow.array({
        label: 'events',
        items: Workflow.struct(settlementEventFields, { label: 'event' }),
      }),
      eventCount: Workflow.number({ label: 'eventCount', integer: true }),
      // The honesty flag. False means the window was not fully paged, so this is
      // a PARTIAL membership; a node that treats it as a deposit total posts the
      // deposit short. Branch on it before doing anything with the events.
      complete: Workflow.boolean({ label: 'complete' }),
      rejected: Workflow.number({ label: 'rejected', integer: true }),
      scannedAfter: Workflow.date({ label: 'scannedAfter' }),
      scannedBefore: Workflow.date({ label: 'scannedBefore' }),
      nextCursor: Workflow.string({ label: 'nextCursor' }),
      hasMore: Workflow.boolean({ label: 'hasMore' }),
    }
  }

  if (resource === 'charge' && operation === 'getMany') {
    return {
      summary: Workflow.string({ label: 'summary' }),
      charges: Workflow.array({
        label: 'charges',
        items: Workflow.struct(chargeFields, { label: 'charge' }),
      }),
      chargeCount: Workflow.number({ label: 'chargeCount', integer: true }),
      rejected: Workflow.number({ label: 'rejected', integer: true }),
      hasMore: Workflow.boolean({ label: 'hasMore' }),
    }
  }

  if (resource === 'charge' && operation === 'get') {
    return {
      // FIRST on purpose, so it leads the variable picker. This is the single
      // most useful thing this block hands a downstream node: Affirm states the
      // Shopify PaymentSession id itself, in `checkout.metadata.transaction_id`,
      // and it is how an Affirm settlement is tied back to a Shopify order when
      // the settlement's own `order_id` does not match (build plan §6 rule 4).
      // Verbatim, gid prefix and all —
      // `gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL`.
      shopifyPaymentSessionId: Workflow.string({ label: 'shopifyPaymentSessionId' }),
      // Affirm's own `order_id`, verbatim. The bare id, without the gid prefix.
      orderId: Workflow.string({ label: 'orderId' }),
      summary: Workflow.string({ label: 'summary' }),
      charge: Workflow.struct(chargeDetailFields, { label: 'charge' }),
      events: Workflow.array({
        label: 'events',
        items: Workflow.struct(chargeEventFields, { label: 'event' }),
      }),
    }
  }

  return {}
}

export const affirmSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [...RESOURCES],
      default: 'settlement',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'getMany',
    }),
    ...affirmInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) =>
    affirmComputeOutputs(String(inputs?.resource ?? ''), String(inputs?.operation ?? '')),
} satisfies WorkflowSchema
