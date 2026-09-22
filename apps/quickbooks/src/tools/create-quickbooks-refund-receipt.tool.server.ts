// src/tools/create-quickbooks-refund-receipt.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import type { MappedRefundReceipt } from './shared/map-refund-receipt'
import {
  type CreateRefundReceiptInput,
  buildRefundReceiptBody,
  mapCreatedRefundReceipt,
} from './shared/native-creates'

export default async function createQuickbooksRefundReceipt(
  input: CreateRefundReceiptInput
): Promise<MappedRefundReceipt> {
  const body = buildRefundReceiptBody(input)
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/refundreceipt', credential, {
    method: 'POST',
    body,
    sandbox,
    requestId: input.requestId,
  })
  return mapCreatedRefundReceipt(result?.RefundReceipt)
}
