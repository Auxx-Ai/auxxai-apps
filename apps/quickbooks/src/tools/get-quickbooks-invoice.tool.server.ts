// src/tools/get-quickbooks-invoice.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapInvoiceDetail, type MappedInvoiceDetail } from './shared/map-invoice'
import { validateQbId } from './shared/qql-builder'
import { resolveCustomerRefs } from './shared/resolve-customer-refs'

interface GetQuickbooksInvoiceInput {
  invoiceId: string
}

type GetQuickbooksInvoiceOutput = MappedInvoiceDetail & {
  auxxContactId: string | null
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function getQuickbooksInvoice(
  input: GetQuickbooksInvoiceInput,
  ctx: ToolExecuteContext
): Promise<GetQuickbooksInvoiceOutput> {
  const id = input.invoiceId?.trim()
  if (!id) invalidInput('invoiceId is required.')
  validateQbId(id, 'invoiceId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, `/invoice/${id}`, credential, { sandbox })
  const raw = result.Invoice
  const mapped = mapInvoiceDetail(raw)

  // Propagate customer refs through the invoice. Fetch the customer to
  // get CompanyName (drives whether company ref is expected).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerResult = await quickbooksApi<any>(
    realmId,
    `/customer/${mapped.customerId}`,
    credential,
    { sandbox }
  )
  const refsResolved = await resolveCustomerRefs(ctx, customerResult.Customer)

  return {
    ...mapped,
    auxxContactId: refsResolved.auxxContactId,
    auxxCompanyId: refsResolved.auxxCompanyId,
    notImportedReason: refsResolved.notImportedReason,
  }
}
