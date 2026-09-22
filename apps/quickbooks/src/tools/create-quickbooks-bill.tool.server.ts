// src/tools/create-quickbooks-bill.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import type { MappedBill } from './shared/map-bill'
import { type CreateBillInput, buildBillBody, mapCreatedBill } from './shared/native-creates'

export default async function createQuickbooksBill(input: CreateBillInput): Promise<MappedBill> {
  const body = buildBillBody(input)
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/bill', credential, {
    method: 'POST',
    body,
    sandbox,
    requestId: input.requestId,
  })
  return mapCreatedBill(result?.Bill)
}
