// src/tools/get-quickbooks-bill-payment.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { isEntityNotFoundFault } from './shared/fault-convergence'
import { type MappedBillPayment, mapBillPayment } from './shared/map-bill-payment'
import { validateQbId } from './shared/qql-builder'

interface GetBillPaymentInput {
  billPaymentId: string
}

type GetBillPaymentOutput = ({ status: 'Found' } & MappedBillPayment) | { status: 'NotFound' }

export default async function getQuickbooksBillPayment(
  input: GetBillPaymentInput
): Promise<GetBillPaymentOutput> {
  const id = input.billPaymentId?.trim()
  if (!id) invalidInput('billPaymentId is required.')
  validateQbId(id, 'billPaymentId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await quickbooksApi<any>(realmId, `/billpayment/${id}`, credential, {
      sandbox,
    })
    return { status: 'Found', ...mapBillPayment(result?.BillPayment) }
  } catch (error) {
    if (isEntityNotFoundFault(error)) return { status: 'NotFound' }
    throw error
  }
}
