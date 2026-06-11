// src/tools/get-quickbooks-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapCustomerDetail, type MappedCustomerDetail } from './shared/map-customer'
import { validateQbId } from './shared/qql-builder'
import { resolveCustomerRefs } from './shared/resolve-customer-refs'

interface GetQuickbooksCustomerInput {
  customerId: string
}

type GetQuickbooksCustomerOutput = MappedCustomerDetail & {
  auxxContactId: string | null
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function getQuickbooksCustomer(
  input: GetQuickbooksCustomerInput,
  ctx: ToolExecuteContext
): Promise<GetQuickbooksCustomerOutput> {
  const id = input.customerId?.trim()
  if (!id) invalidInput('customerId is required.')
  validateQbId(id, 'customerId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, `/customer/${id}`, credential, { sandbox })
  const raw = result.Customer
  const mapped = mapCustomerDetail(raw)
  const refs = await resolveCustomerRefs(raw)

  return {
    ...mapped,
    auxxContactId: refs.auxxContactId,
    auxxCompanyId: refs.auxxCompanyId,
    notImportedReason: refs.notImportedReason,
  }
}
