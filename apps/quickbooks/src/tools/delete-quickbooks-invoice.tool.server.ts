// src/tools/delete-quickbooks-invoice.tool.server.ts

import {
  deleteQuickbooksEntity,
  type DeleteQuickbooksEntityOutput,
} from './shared/fault-convergence'

interface DeleteInvoiceInput {
  invoiceId: string
  syncToken: string
}

/**
 * Delete one invoice. Converges on `alreadyGone` for an id QuickBooks no
 * longer holds — see delete-quickbooks-journal-entry.tool.server.ts, the
 * original of this behaviour.
 */
export default async function deleteQuickbooksInvoice(
  input: DeleteInvoiceInput
): Promise<DeleteQuickbooksEntityOutput> {
  return deleteQuickbooksEntity({
    path: '/invoice?operation=delete',
    entityResponseKey: 'Invoice',
    idLabel: 'invoiceId',
    id: input.invoiceId,
    syncToken: input.syncToken,
  })
}
