// src/tools/delete-quickbooks-payment.tool.server.ts

import {
  deleteQuickbooksEntity,
  type DeleteQuickbooksEntityOutput,
} from './shared/fault-convergence'

interface DeletePaymentInput {
  paymentId: string
  syncToken: string
}

/**
 * Delete one payment. Converges on `alreadyGone` for an id QuickBooks no
 * longer holds — see delete-quickbooks-journal-entry.tool.server.ts, the
 * original of this behaviour. 🛑 Rollback order: a Payment before the Invoice
 * it applies to — that ordering is the caller's responsibility, not this tool's.
 */
export default async function deleteQuickbooksPayment(
  input: DeletePaymentInput
): Promise<DeleteQuickbooksEntityOutput> {
  return deleteQuickbooksEntity({
    path: '/payment?operation=delete',
    entityResponseKey: 'Payment',
    idLabel: 'paymentId',
    id: input.paymentId,
    syncToken: input.syncToken,
  })
}
