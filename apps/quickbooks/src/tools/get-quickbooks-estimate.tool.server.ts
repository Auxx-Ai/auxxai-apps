// src/tools/get-quickbooks-estimate.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapEstimateDetail, type MappedEstimateDetail } from './shared/map-estimate'
import { validateQbId } from './shared/qql-builder'
import { resolveCustomerRefs } from './shared/resolve-customer-refs'

interface GetQuickbooksEstimateInput {
  estimateId: string
}

type GetQuickbooksEstimateOutput = MappedEstimateDetail & {
  auxxContactId: string | null
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function getQuickbooksEstimate(
  input: GetQuickbooksEstimateInput,
  ctx: ToolExecuteContext
): Promise<GetQuickbooksEstimateOutput> {
  const id = input.estimateId?.trim()
  if (!id) invalidInput('estimateId is required.')
  validateQbId(id, 'estimateId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, `/estimate/${id}`, credential, { sandbox })
  const mapped = mapEstimateDetail(result.Estimate)

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
