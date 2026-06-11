// src/tools/get-quickbooks-payment.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapPaymentDetail, type MappedPaymentDetail } from './shared/map-payment'
import { validateQbId } from './shared/qql-builder'
import { resolveCustomerRefs } from './shared/resolve-customer-refs'

interface GetQuickbooksPaymentInput {
  paymentId: string
}

type GetQuickbooksPaymentOutput = MappedPaymentDetail & {
  auxxContactId: string | null
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function getQuickbooksPayment(
  input: GetQuickbooksPaymentInput,
  ctx: ToolExecuteContext
): Promise<GetQuickbooksPaymentOutput> {
  const id = input.paymentId?.trim()
  if (!id) invalidInput('paymentId is required.')
  validateQbId(id, 'paymentId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, `/payment/${id}`, credential, { sandbox })
  const mapped = mapPaymentDetail(result.Payment)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerResult = await quickbooksApi<any>(
    realmId,
    `/customer/${mapped.customerId}`,
    credential,
    { sandbox }
  )
  const refsResolved = await resolveCustomerRefs(customerResult.Customer)

  return {
    ...mapped,
    auxxContactId: refsResolved.auxxContactId,
    auxxCompanyId: refsResolved.auxxCompanyId,
    notImportedReason: refsResolved.notImportedReason,
  }
}
