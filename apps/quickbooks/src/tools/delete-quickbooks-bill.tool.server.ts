// src/tools/delete-quickbooks-bill.tool.server.ts

import {
  deleteQuickbooksEntity,
  type DeleteQuickbooksEntityOutput,
} from './shared/fault-convergence'

interface DeleteBillInput {
  billId: string
  syncToken: string
}

export default async function deleteQuickbooksBill(
  input: DeleteBillInput
): Promise<DeleteQuickbooksEntityOutput> {
  return deleteQuickbooksEntity({
    path: '/bill?operation=delete',
    entityResponseKey: 'Bill',
    idLabel: 'billId',
    id: input.billId,
    syncToken: input.syncToken,
  })
}
