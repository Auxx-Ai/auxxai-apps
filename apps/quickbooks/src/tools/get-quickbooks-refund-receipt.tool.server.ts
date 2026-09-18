// src/tools/get-quickbooks-refund-receipt.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { isEntityNotFoundFault } from './shared/fault-convergence'
import { mapRefundReceipt } from './shared/map-refund-receipt'
import { validateQbId } from './shared/qql-builder'

interface GetRefundReceiptInput {
  refundReceiptId: string
}

type GetRefundReceiptOutput =
  | ({ status: 'Found' } & ReturnType<typeof mapRefundReceipt>)
  | { status: 'NotFound' }

export default async function getQuickbooksRefundReceipt(
  input: GetRefundReceiptInput
): Promise<GetRefundReceiptOutput> {
  const id = input.refundReceiptId?.trim()
  if (!id) invalidInput('refundReceiptId is required.')
  validateQbId(id, 'refundReceiptId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await quickbooksApi<any>(realmId, `/refundreceipt/${id}`, credential, {
      sandbox,
    })
    return { status: 'Found', ...mapRefundReceipt(result?.RefundReceipt) }
  } catch (error) {
    if (isEntityNotFoundFault(error)) return { status: 'NotFound' }
    throw error
  }
}
