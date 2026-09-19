// src/blocks/authorize-net/authorize-net-schema.ts

// Inputs are one flat object shared by all four operations, so keys are namespaced
// `<resource><Operation><Field>` and none is marked `required`. `batchId` and `transId`
// keep the tool's bare name: block validation matches required input names, and a
// prefixed one would warn permanently on every node.

import { type WorkflowSchema, Workflow } from '@auxx/sdk'

/** The block's resource picker. */
export const RESOURCES = [
  { value: 'batch', label: 'Settled Batch' },
  { value: 'transaction', label: 'Transaction' },
] as const

/** Operations per resource. The single source of the surface; everything else derives. */
export const OPERATIONS_ALL = {
  batch: [
    { value: 'getMany', label: 'List Settled Batches' },
    { value: 'getTransactions', label: 'List Batch Transactions' },
  ],
  transaction: [
    { value: 'get', label: 'Get Transaction' },
    { value: 'getUnsettled', label: 'List Unsettled' },
  ],
} as const

/** Operation options per resource; the panel narrows the flat union with these. */
export const OPERATIONS = OPERATIONS_ALL as unknown as Record<
  string,
  { value: string; label: string }[]
>

/** The flat union the schema's `operation` select advertises. */
export const ALL_OPERATIONS = [
  { value: 'getMany', label: 'List' },
  { value: 'getTransactions', label: 'List Batch Transactions' },
  { value: 'get', label: 'Get' },
  { value: 'getUnsettled', label: 'List Unsettled' },
] as const

/** Structural validity: does this `resource.operation` pair exist? Derived. */
export const VALID_OPERATIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(OPERATIONS).map(([resource, ops]) => [resource, ops.map((op) => op.value)])
)

// Local rather than imported from `tools/shared/settlements.ts`, which would ship the
// whole fetch layer to the canvas for one integer.
const PAGE_LIMIT = 1000

export const authorizeNetInputs = {
  // ── Batch: List Settled Batches ─────────────────────────────────────────
  batchGetManyAfter: Workflow.date({
    label: 'From settlement date',
    description:
      'Earliest settlement date, YYYY-MM-DD. A range wider than 31 days is split into ' +
      'consecutive windows automatically, because that is Authorize.net’s own cap per call.',
    acceptsVariables: true,
  }),
  batchGetManyBefore: Workflow.date({
    label: 'To settlement date',
    description: 'Latest settlement date, YYYY-MM-DD. Defaults to today.',
    acceptsVariables: true,
  }),

  // ── Batch: List Batch Transactions ──────────────────────────────────────
  batchId: Workflow.string({
    label: 'Batch ID',
    description: 'The settled batch id, e.g. 10198080. Bind this from an upstream batch row.',
    placeholder: '10198080',
    acceptsVariables: true,
  }),
  batchGetTransactionsLimit: Workflow.number({
    label: 'Transactions per page',
    description: `Rows to request. Up to ${PAGE_LIMIT}; leave blank for the maximum.`,
    integer: true,
    min: 1,
    max: PAGE_LIMIT,
    acceptsVariables: true,
  }),
  batchGetTransactionsCursor: Workflow.string({
    label: 'Cursor',
    description: 'The nextCursor from a previous run, to read the following page.',
    acceptsVariables: true,
  }),

  // ── Transaction: Get Transaction ────────────────────────────────────────
  transId: Workflow.string({
    label: 'Transaction ID',
    description: 'The Authorize.net transaction id, e.g. 2149186960.',
    placeholder: '2149186960',
    acceptsVariables: true,
  }),

  // ── Transaction: List Unsettled ─────────────────────────────────────────
  transactionGetUnsettledLimit: Workflow.number({
    label: 'Transactions per page',
    description: `Rows to request. Up to ${PAGE_LIMIT}; leave blank for the maximum.`,
    integer: true,
    min: 1,
    max: PAGE_LIMIT,
    acceptsVariables: true,
  }),
  transactionGetUnsettledCursor: Workflow.string({
    label: 'Cursor',
    description: 'The nextCursor from a previous run, to read the following page.',
    acceptsVariables: true,
  }),
}

/** Per-card-brand statistics on one batch. */
const batchBrandFields = {
  accountType: Workflow.string(),
  chargeAmount: Workflow.string(),
  chargeCount: Workflow.number({ integer: true }),
  refundAmount: Workflow.string(),
  refundCount: Workflow.number({ integer: true }),
  returnedItemAmount: Workflow.string(),
  returnedItemCount: Workflow.number({ integer: true }),
  chargebackAmount: Workflow.string(),
  chargebackCount: Workflow.number({ integer: true }),
  voidCount: Workflow.number({ integer: true }),
  declineCount: Workflow.number({ integer: true }),
  errorCount: Workflow.number({ integer: true }),
}

/** One settled batch. `netAmount` sums `perBrand`; no fee field, the acquirer bills monthly. */
const batchFields = {
  batchId: Workflow.string(),
  settledAt: Workflow.datetime(),
  settledOn: Workflow.date(),
  state: Workflow.string(),
  paymentMethod: Workflow.string(),
  netAmount: Workflow.string(),
  currency: Workflow.string(),
  perBrand: Workflow.array({ items: Workflow.struct(batchBrandFields, { label: 'brand' }) }),
}

/** One transaction inside a batch. */
const batchTransactionFields = {
  transId: Workflow.string(),
  submittedAt: Workflow.datetime(),
  status: Workflow.string(),
  amount: Workflow.string(),
  currency: Workflow.string(),
  invoiceNumber: Workflow.string(),
  accountType: Workflow.string(),
  accountNumber: Workflow.string(),
  hasReturnedItems: Workflow.boolean(),
}

/** A captured-but-unsettled transaction. */
const unsettledTransactionFields = {
  ...batchTransactionFields,
  marketType: Workflow.string(),
  product: Workflow.string(),
}

/** One transaction's detail. No customer name, email or address, by construction. */
const transactionDetailFields = {
  transId: Workflow.string(),
  type: Workflow.string(),
  status: Workflow.string(),
  submittedAt: Workflow.datetime(),
  authAmount: Workflow.string(),
  settleAmount: Workflow.string(),
  currency: Workflow.string(),
  authCode: Workflow.string(),
  refTransId: Workflow.string(),
  networkTransId: Workflow.string(),
  batchId: Workflow.string(),
  batchSettledAt: Workflow.datetime(),
  batchState: Workflow.string(),
  invoiceNumber: Workflow.string(),
  description: Workflow.string(),
  purchaseOrderNumber: Workflow.string(),
  cardType: Workflow.string(),
  cardNumber: Workflow.string(),
}

/** The variables each operation publishes; dispatched per operation, never unioned. */
export function authorizeNetComputeOutputs(resource: string, operation: string) {
  if (resource === 'batch' && operation === 'getMany') {
    return {
      summary: Workflow.string({ label: 'summary' }),
      batches: Workflow.array({
        label: 'batches',
        items: Workflow.struct(batchFields, { label: 'batch' }),
      }),
      batchCount: Workflow.number({ label: 'batchCount', integer: true }),
      rejected: Workflow.number({ label: 'rejected', integer: true }),
      hasMore: Workflow.boolean({ label: 'hasMore' }),
    }
  }

  if (resource === 'batch' && operation === 'getTransactions') {
    return {
      summary: Workflow.string({ label: 'summary' }),
      transactions: Workflow.array({
        label: 'transactions',
        items: Workflow.struct(batchTransactionFields, { label: 'transaction' }),
      }),
      transactionCount: Workflow.number({ label: 'transactionCount', integer: true }),
      total: Workflow.number({ label: 'total', integer: true }),
      rejected: Workflow.number({ label: 'rejected', integer: true }),
      nextCursor: Workflow.string({ label: 'nextCursor' }),
      hasMore: Workflow.boolean({ label: 'hasMore' }),
    }
  }

  if (resource === 'transaction' && operation === 'get') {
    return {
      // First so it leads the variable picker: the invoice number is how a settled
      // transaction is tied back to its order (build plan §6 B).
      invoiceNumber: Workflow.string({ label: 'invoiceNumber' }),
      summary: Workflow.string({ label: 'summary' }),
      transaction: Workflow.struct(transactionDetailFields, { label: 'transaction' }),
    }
  }

  if (resource === 'transaction' && operation === 'getUnsettled') {
    return {
      summary: Workflow.string({ label: 'summary' }),
      transactions: Workflow.array({
        label: 'transactions',
        items: Workflow.struct(unsettledTransactionFields, { label: 'transaction' }),
      }),
      transactionCount: Workflow.number({ label: 'transactionCount', integer: true }),
      total: Workflow.number({ label: 'total', integer: true }),
      rejected: Workflow.number({ label: 'rejected', integer: true }),
      nextCursor: Workflow.string({ label: 'nextCursor' }),
      hasMore: Workflow.boolean({ label: 'hasMore' }),
    }
  }

  return {}
}

export const authorizeNetSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [...RESOURCES],
      default: 'batch',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'getMany',
    }),
    ...authorizeNetInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) =>
    authorizeNetComputeOutputs(String(inputs?.resource ?? ''), String(inputs?.operation ?? '')),
} satisfies WorkflowSchema
