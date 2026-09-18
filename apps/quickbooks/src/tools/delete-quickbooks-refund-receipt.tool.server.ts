// src/tools/delete-quickbooks-refund-receipt.tool.server.ts

import {
  deleteQuickbooksEntity,
  type DeleteQuickbooksEntityOutput,
} from './shared/fault-convergence'

interface DeleteRefundReceiptInput {
  refundReceiptId: string
  syncToken: string
}

export default async function deleteQuickbooksRefundReceipt(
  input: DeleteRefundReceiptInput
): Promise<DeleteQuickbooksEntityOutput> {
  return deleteQuickbooksEntity({
    path: '/refundreceipt?operation=delete',
    entityResponseKey: 'RefundReceipt',
    idLabel: 'refundReceiptId',
    id: input.refundReceiptId,
    syncToken: input.syncToken,
  })
}
