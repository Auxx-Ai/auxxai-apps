// src/tools/get-quickbooks-deposit.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { isEntityNotFoundFault } from './shared/fault-convergence'
import { mapDeposit } from './shared/map-deposit'
import { validateQbId } from './shared/qql-builder'

interface GetDepositInput {
  depositId: string
}

type GetDepositOutput =
  | ({ status: 'Found' } & ReturnType<typeof mapDeposit>)
  | { status: 'NotFound' }

export default async function getQuickbooksDeposit(
  input: GetDepositInput
): Promise<GetDepositOutput> {
  const id = input.depositId?.trim()
  if (!id) invalidInput('depositId is required.')
  validateQbId(id, 'depositId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await quickbooksApi<any>(realmId, `/deposit/${id}`, credential, { sandbox })
    return { status: 'Found', ...mapDeposit(result?.Deposit) }
  } catch (error) {
    if (isEntityNotFoundFault(error)) return { status: 'NotFound' }
    throw error
  }
}
