// src/tools/find-quickbooks-bill.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapBill, type MappedBill } from './shared/map-bill'
import { quoteQqlString } from './shared/qql-builder'

interface FindBillInput {
  docNumber: string
  limit?: number
}

interface FindBillOutput {
  bills: MappedBill[]
}

export default async function findQuickbooksBill(input: FindBillInput): Promise<FindBillOutput> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Bill', credential, {
    where: `DocNumber = ${quoteQqlString(input.docNumber)}`,
    limit: input.limit ?? 20,
    sandbox,
  })

  return { bills: raw.map(mapBill) }
}
