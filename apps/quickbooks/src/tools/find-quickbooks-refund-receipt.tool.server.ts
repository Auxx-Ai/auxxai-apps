// src/tools/find-quickbooks-refund-receipt.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapRefundReceipt, type MappedRefundReceipt } from './shared/map-refund-receipt'
import { quoteQqlString } from './shared/qql-builder'

interface FindRefundReceiptInput {
  docNumber: string
  limit?: number
}

interface FindRefundReceiptOutput {
  refundReceipts: MappedRefundReceipt[]
}

export default async function findQuickbooksRefundReceipt(
  input: FindRefundReceiptInput
): Promise<FindRefundReceiptOutput> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'RefundReceipt', credential, {
    where: `DocNumber = ${quoteQqlString(input.docNumber)}`,
    limit: input.limit ?? 20,
    sandbox,
  })

  return { refundReceipts: raw.map(mapRefundReceipt) }
}
