// src/tools/get-quickbooks-credit-memo.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { isEntityNotFoundFault } from './shared/fault-convergence'
import { mapCreditMemo } from './shared/map-credit-memo'
import { validateQbId } from './shared/qql-builder'

interface GetCreditMemoInput {
  creditMemoId: string
}

type GetCreditMemoOutput =
  | ({ status: 'Found' } & ReturnType<typeof mapCreditMemo>)
  | { status: 'NotFound' }

export default async function getQuickbooksCreditMemo(
  input: GetCreditMemoInput
): Promise<GetCreditMemoOutput> {
  const id = input.creditMemoId?.trim()
  if (!id) invalidInput('creditMemoId is required.')
  validateQbId(id, 'creditMemoId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await quickbooksApi<any>(realmId, `/creditmemo/${id}`, credential, { sandbox })
    return { status: 'Found', ...mapCreditMemo(result?.CreditMemo) }
  } catch (error) {
    if (isEntityNotFoundFault(error)) return { status: 'NotFound' }
    throw error
  }
}
