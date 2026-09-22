// src/tools/create-quickbooks-deposit.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import type { MappedDeposit } from './shared/map-deposit'
import {
  type CreateDepositInput,
  buildDepositBody,
  mapCreatedDeposit,
} from './shared/native-creates'

export default async function createQuickbooksDeposit(
  input: CreateDepositInput
): Promise<MappedDeposit> {
  const body = buildDepositBody(input)
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/deposit', credential, {
    method: 'POST',
    body,
    sandbox,
    requestId: input.requestId,
  })
  return mapCreatedDeposit(result?.Deposit)
}
