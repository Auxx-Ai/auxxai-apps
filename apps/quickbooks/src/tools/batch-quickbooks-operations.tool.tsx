// src/tools/batch-quickbooks-operations.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import batchQuickbooksOperationsExecute from './batch-quickbooks-operations.tool.server'
import { createQuickbooksBillInputs } from './create-quickbooks-bill.tool'
import { createQuickbooksCreditMemoInputs } from './create-quickbooks-credit-memo.tool'
import { createQuickbooksDepositInputs } from './create-quickbooks-deposit.tool'
import { createQuickbooksInvoiceInputs } from './create-quickbooks-invoice.tool'
import { createQuickbooksJournalEntryInputs } from './create-quickbooks-journal-entry.tool'
import { createQuickbooksPaymentInputs } from './create-quickbooks-payment.tool'
import { createQuickbooksRefundReceiptInputs } from './create-quickbooks-refund-receipt.tool'
import { createQuickbooksSalesReceiptInputs } from './create-quickbooks-sales-receipt.tool'

const bId = z.string().min(1).describe('Caller-chosen id echoed on the answer; unique per call.')

/** `input` is the matching create_quickbooks_<object> tool's input, minus its per-call requestId. */
function createItem<K extends string, I extends z.ZodTypeAny>(object: K, input: I) {
  return z.object({ bId, operation: z.literal('create'), object: z.literal(object), input })
}

const queryItem = z.object({
  bId,
  operation: z.literal('query'),
  object: z.enum(['invoice', 'sales_receipt', 'credit_memo', 'refund_receipt', 'bill', 'journal']),
  docNumbers: z
    .array(z.string().min(1))
    .min(1)
    .max(30)
    .describe('Answered per docNumber exactly as the matching find_quickbooks_<object> tool.'),
})

const faultSchema = z.object({
  type: z.string().nullable(),
  code: z.string().nullable(),
  message: z.string().nullable(),
  detail: z.string().nullable(),
  element: z.string().nullable(),
})

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const batchQuickbooksOperationsTool = defineTool({
  id: 'batch_quickbooks_operations',
  name: 'Batch QuickBooks operations',
  description:
    'Run up to 30 QuickBooks creates and DocNumber queries in one call. Each item answers on its own: a create with the matching create_quickbooks_<object> answer, a query with the matching find_quickbooks_<object> answer per docNumber, or a failure carrying the QuickBooks fault.',
  icon: quickbooksIcon,
  inputs: z.object({
    requestId: z
      .string()
      .max(36)
      .optional()
      .describe(
        'Idempotency key for the whole call, max 36 chars. QuickBooks replays an item only when both requestId and its bId (max 10 chars when requestId is set) match the original.'
      ),
    items: z
      .array(
        z.union([
          createItem('invoice', createQuickbooksInvoiceInputs.omit({ requestId: true })),
          createItem('payment', createQuickbooksPaymentInputs.omit({ requestId: true })),
          createItem('sales_receipt', createQuickbooksSalesReceiptInputs.omit({ requestId: true })),
          createItem('credit_memo', createQuickbooksCreditMemoInputs.omit({ requestId: true })),
          createItem(
            'refund_receipt',
            createQuickbooksRefundReceiptInputs.omit({ requestId: true })
          ),
          createItem('deposit', createQuickbooksDepositInputs.omit({ requestId: true })),
          createItem('bill', createQuickbooksBillInputs.omit({ requestId: true })),
          createItem('journal', createQuickbooksJournalEntryInputs.omit({ requestId: true })),
          queryItem,
        ])
      )
      .min(1)
      .max(30),
  }),
  outputs: z.object({
    items: z.array(
      z.object({
        bId: z.string(),
        operation: z.enum(['create', 'query']),
        object: z.string(),
        ok: z.boolean(),
        result: z
          .unknown()
          .optional()
          .describe(
            'On success: the single create tool answer, or for a query a map of docNumber to the single find tool answer.'
          ),
        error: z
          .object({
            code: z.string(),
            message: z.string(),
            fault: faultSchema.nullable(),
          })
          .optional(),
      })
    ),
  }),
  exampleOutput: {
    items: [
      {
        bId: 'q1',
        operation: 'query',
        object: 'invoice',
        ok: true,
        result: { 'AUXX-INV-1': { invoices: [] } },
      },
      {
        bId: 'c1',
        operation: 'create',
        object: 'invoice',
        ok: true,
        result: {
          invoiceId: '244',
          docNumber: 'AUXX-INV-1',
          totalAmt: 1500,
          balance: 1500,
          dueDate: null,
          syncToken: '0',
        },
      },
      {
        bId: 'c2',
        operation: 'create',
        object: 'invoice',
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Duplicate Document Number Error',
          fault: {
            type: 'ValidationFault',
            code: '6140',
            message: 'Duplicate Document Number Error',
            detail: 'Duplicate Document Number Error : You must specify a different number.',
            element: null,
          },
        },
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: batchQuickbooksOperationsExecute,
})
