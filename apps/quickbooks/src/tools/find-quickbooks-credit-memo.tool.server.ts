// src/tools/find-quickbooks-credit-memo.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapCreditMemo, type MappedCreditMemo } from './shared/map-credit-memo'
import { quoteQqlString } from './shared/qql-builder'

interface FindCreditMemoInput {
  docNumber: string
  limit?: number
}

interface FindCreditMemoOutput {
  creditMemos: MappedCreditMemo[]
}

export default async function findQuickbooksCreditMemo(
  input: FindCreditMemoInput
): Promise<FindCreditMemoOutput> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'CreditMemo', credential, {
    where: `DocNumber = ${quoteQqlString(input.docNumber)}`,
    limit: input.limit ?? 20,
    sandbox,
  })

  return { creditMemos: raw.map(mapCreditMemo) }
}
