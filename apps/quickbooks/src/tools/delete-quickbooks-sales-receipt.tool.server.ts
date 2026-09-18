// src/tools/delete-quickbooks-sales-receipt.tool.server.ts

import {
  deleteQuickbooksEntity,
  type DeleteQuickbooksEntityOutput,
} from './shared/fault-convergence'

interface DeleteSalesReceiptInput {
  salesReceiptId: string
  syncToken: string
}

/**
 * Delete one sales receipt. Converges on `alreadyGone` for an id QuickBooks no
 * longer holds — see delete-quickbooks-journal-entry.tool.server.ts, the
 * original of this behaviour.
 */
export default async function deleteQuickbooksSalesReceipt(
  input: DeleteSalesReceiptInput
): Promise<DeleteQuickbooksEntityOutput> {
  return deleteQuickbooksEntity({
    path: '/salesreceipt?operation=delete',
    entityResponseKey: 'SalesReceipt',
    idLabel: 'salesReceiptId',
    id: input.salesReceiptId,
    syncToken: input.syncToken,
  })
}
