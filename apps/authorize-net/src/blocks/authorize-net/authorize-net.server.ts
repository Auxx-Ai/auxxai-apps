// src/blocks/authorize-net/authorize-net.server.ts

// `transaction.get` is projected field by field so a field the tool grows later is not
// surfaced into an email or a webhook until someone adds it here deliberately.

import type { WorkflowExecuteFunction } from '@auxx/sdk'
import { type authorizeNetSchema, VALID_OPERATIONS } from './authorize-net-schema'
import { authorizeNetToolMap } from './authorize-net-tool-map'

/** A usable string, or `undefined` so the tool applies its own default. */
function text(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return value === undefined || value === null ? undefined : String(value)
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/** A positive integer, or `undefined`; a bound page size can arrive as `'1000'` or `''`. */
function count(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return Math.trunc(parsed)
}

/** The block's namespaced inputs, mapped onto the dispatched tool's flat ones. */
function projectInputs(key: string, input: Record<string, any>): Record<string, unknown> {
  switch (key) {
    case 'batch.getMany':
      return {
        after: text(input.batchGetManyAfter),
        before: text(input.batchGetManyBefore),
      }
    case 'batch.getTransactions':
      return {
        batchId: text(input.batchId),
        limit: count(input.batchGetTransactionsLimit),
        cursor: text(input.batchGetTransactionsCursor),
      }
    case 'transaction.get':
      return { transId: text(input.transId) }
    case 'transaction.getUnsettled':
      return {
        limit: count(input.transactionGetUnsettledLimit),
        cursor: text(input.transactionGetUnsettledCursor),
      }
    default:
      throw new Error(`No input projection for ${key}`)
  }
}

/** The tool's output, shaped into the variables `authorizeNetComputeOutputs` declares. */
function projectOutput(key: string, output: Record<string, any>): Record<string, unknown> {
  switch (key) {
    case 'batch.getMany':
      return { ...output, batchCount: (output.batches ?? []).length }
    case 'batch.getTransactions':
    case 'transaction.getUnsettled':
      return { ...output, transactionCount: (output.transactions ?? []).length }
    case 'transaction.get':
      return {
        // Lifted to the top level: binding it is the point of the operation.
        invoiceNumber: output.invoiceNumber ?? null,
        summary: output.summary ?? '',
        transaction: {
          transId: output.transId ?? null,
          type: output.type ?? null,
          status: output.status ?? null,
          submittedAt: output.submittedAt ?? null,
          authAmount: output.authAmount ?? null,
          settleAmount: output.settleAmount ?? null,
          currency: output.currency ?? null,
          authCode: output.authCode ?? null,
          refTransId: output.refTransId ?? null,
          networkTransId: output.networkTransId ?? null,
          batchId: output.batchId ?? null,
          batchSettledAt: output.batchSettledAt ?? null,
          batchState: output.batchState ?? null,
          invoiceNumber: output.invoiceNumber ?? null,
          description: output.description ?? null,
          purchaseOrderNumber: output.purchaseOrderNumber ?? null,
          cardType: output.cardType ?? null,
          cardNumber: output.cardNumber ?? null,
        },
      }
    default:
      throw new Error(`No output projection for ${key}`)
  }
}

const execute: WorkflowExecuteFunction<typeof authorizeNetSchema> = async (input, ctx) => {
  const flat = input as unknown as Record<string, any>
  const resource = String(flat.resource ?? '')
  const operation = String(flat.operation ?? '')

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const key = `${resource}.${operation}`
  const toolId = (authorizeNetToolMap as Record<string, string>)[key]
  if (!toolId) throw new Error(`No tool mapped for ${key}`)

  const result = await ctx.runTool<Record<string, unknown>, Record<string, any>>(
    toolId,
    projectInputs(key, flat)
  )
  return projectOutput(key, result ?? {}) as any
}

export default execute
