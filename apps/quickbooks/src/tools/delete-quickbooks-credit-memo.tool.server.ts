// src/tools/delete-quickbooks-credit-memo.tool.server.ts

import {
  deleteQuickbooksEntity,
  type DeleteQuickbooksEntityOutput,
} from './shared/fault-convergence'

interface DeleteCreditMemoInput {
  creditMemoId: string
  syncToken: string
}

export default async function deleteQuickbooksCreditMemo(
  input: DeleteCreditMemoInput
): Promise<DeleteQuickbooksEntityOutput> {
  return deleteQuickbooksEntity({
    path: '/creditmemo?operation=delete',
    entityResponseKey: 'CreditMemo',
    idLabel: 'creditMemoId',
    id: input.creditMemoId,
    syncToken: input.syncToken,
  })
}
