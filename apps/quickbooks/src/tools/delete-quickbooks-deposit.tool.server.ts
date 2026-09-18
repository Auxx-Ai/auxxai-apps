// src/tools/delete-quickbooks-deposit.tool.server.ts

import {
  deleteQuickbooksEntity,
  type DeleteQuickbooksEntityOutput,
} from './shared/fault-convergence'

interface DeleteDepositInput {
  depositId: string
  syncToken: string
}

export default async function deleteQuickbooksDeposit(
  input: DeleteDepositInput
): Promise<DeleteQuickbooksEntityOutput> {
  return deleteQuickbooksEntity({
    path: '/deposit?operation=delete',
    entityResponseKey: 'Deposit',
    idLabel: 'depositId',
    id: input.depositId,
    syncToken: input.syncToken,
  })
}
