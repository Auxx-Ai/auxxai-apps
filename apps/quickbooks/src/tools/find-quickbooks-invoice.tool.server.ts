// src/tools/find-quickbooks-invoice.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapInvoiceSummary, type MappedInvoiceSummary } from './shared/map-invoice'
import { quoteQqlString } from './shared/qql-builder'

interface FindInvoiceInput {
  docNumber: string
  limit?: number
}

interface FindInvoiceOutput {
  invoices: MappedInvoiceSummary[]
}

/** Look up invoices by exact document number — the layer-2 net's duplicate check. */
export default async function findQuickbooksInvoice(
  input: FindInvoiceInput
): Promise<FindInvoiceOutput> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Invoice', credential, {
    where: `DocNumber = ${quoteQqlString(input.docNumber)}`,
    limit: input.limit ?? 20,
    sandbox,
  })

  return { invoices: raw.map(mapInvoiceSummary) }
}
