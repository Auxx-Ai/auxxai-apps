// src/tools/create-quickbooks-credit-memo.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import type { MappedCreditMemo } from './shared/map-credit-memo'
import {
  type CreateCreditMemoInput,
  buildCreditMemoBody,
  mapCreatedCreditMemo,
} from './shared/native-creates'

export default async function createQuickbooksCreditMemo(
  input: CreateCreditMemoInput
): Promise<MappedCreditMemo> {
  const body = buildCreditMemoBody(input)
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/creditmemo', credential, {
    method: 'POST',
    body,
    sandbox,
    requestId: input.requestId,
  })
  return mapCreatedCreditMemo(result?.CreditMemo)
}
