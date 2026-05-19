// src/tools/get-quickbooks-vendor.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapVendorDetail, type MappedVendorDetail } from './shared/map-vendor'
import { validateQbId } from './shared/qql-builder'
import { resolveVendorRef } from './shared/resolve-vendor-ref'

interface GetQuickbooksVendorInput {
  vendorId: string
}

type GetQuickbooksVendorOutput = MappedVendorDetail & {
  auxxCompanyId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function getQuickbooksVendor(
  input: GetQuickbooksVendorInput,
  ctx: ToolExecuteContext
): Promise<GetQuickbooksVendorOutput> {
  const id = input.vendorId?.trim()
  if (!id) invalidInput('vendorId is required.')
  validateQbId(id, 'vendorId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, `/vendor/${id}`, credential, { sandbox })
  const mapped = mapVendorDetail(result.Vendor)
  const auxxCompanyId = await resolveVendorRef(ctx, mapped.vendorId)

  return {
    ...mapped,
    auxxCompanyId,
    notImportedReason: auxxCompanyId ? null : 'NOT_IMPORTED',
  }
}
