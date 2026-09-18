// src/tools/get-quickbooks-sales-receipt.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { isEntityNotFoundFault } from './shared/fault-convergence'
import { mapSalesReceipt } from './shared/map-sales-receipt'
import { validateQbId } from './shared/qql-builder'

interface GetSalesReceiptInput {
  salesReceiptId: string
}

type GetSalesReceiptOutput =
  | ({ status: 'Found' } & ReturnType<typeof mapSalesReceipt>)
  | { status: 'NotFound' }

/** Get by id, converging on `{ status: 'NotFound' }` rather than throwing on a 610 fault or a 404. */
export default async function getQuickbooksSalesReceipt(
  input: GetSalesReceiptInput
): Promise<GetSalesReceiptOutput> {
  const id = input.salesReceiptId?.trim()
  if (!id) invalidInput('salesReceiptId is required.')
  validateQbId(id, 'salesReceiptId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await quickbooksApi<any>(realmId, `/salesreceipt/${id}`, credential, {
      sandbox,
    })
    return { status: 'Found', ...mapSalesReceipt(result?.SalesReceipt) }
  } catch (error) {
    if (isEntityNotFoundFault(error)) return { status: 'NotFound' }
    throw error
  }
}
