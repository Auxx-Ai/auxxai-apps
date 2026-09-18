// src/tools/get-quickbooks-bill.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { isEntityNotFoundFault } from './shared/fault-convergence'
import { mapBill } from './shared/map-bill'
import { validateQbId } from './shared/qql-builder'

interface GetBillInput {
  billId: string
}

type GetBillOutput = ({ status: 'Found' } & ReturnType<typeof mapBill>) | { status: 'NotFound' }

export default async function getQuickbooksBill(input: GetBillInput): Promise<GetBillOutput> {
  const id = input.billId?.trim()
  if (!id) invalidInput('billId is required.')
  validateQbId(id, 'billId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await quickbooksApi<any>(realmId, `/bill/${id}`, credential, { sandbox })
    return { status: 'Found', ...mapBill(result?.Bill) }
  } catch (error) {
    if (isEntityNotFoundFault(error)) return { status: 'NotFound' }
    throw error
  }
}
