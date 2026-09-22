// src/tools/create-quickbooks-sales-receipt.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import type { MappedSalesReceipt } from './shared/map-sales-receipt'
import {
  type CreateSalesReceiptInput,
  buildSalesReceiptBody,
  mapCreatedSalesReceipt,
} from './shared/native-creates'

export default async function createQuickbooksSalesReceipt(
  input: CreateSalesReceiptInput
): Promise<MappedSalesReceipt> {
  const body = buildSalesReceiptBody(input)
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/salesreceipt', credential, {
    method: 'POST',
    body,
    sandbox,
    // Intuit-guaranteed idempotence for a repeat delivery of THIS request.
    requestId: input.requestId,
  })
  return mapCreatedSalesReceipt(result?.SalesReceipt)
}
