// src/tools/find-quickbooks-sales-receipt.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapSalesReceipt, type MappedSalesReceipt } from './shared/map-sales-receipt'
import { quoteQqlString } from './shared/qql-builder'

interface FindSalesReceiptInput {
  docNumber: string
  limit?: number
}

interface FindSalesReceiptOutput {
  salesReceipts: MappedSalesReceipt[]
}

/** Look up sales receipts by document number — the layer-2 net's duplicate check. */
export default async function findQuickbooksSalesReceipt(
  input: FindSalesReceiptInput
): Promise<FindSalesReceiptOutput> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'SalesReceipt', credential, {
    where: `DocNumber = ${quoteQqlString(input.docNumber)}`,
    limit: input.limit ?? 20,
    sandbox,
  })

  return { salesReceipts: raw.map(mapSalesReceipt) }
}
