// src/tools/find-quickbooks-vendor.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapVendorDetail, type MappedVendorDetail } from './shared/map-vendor'
import { quoteQqlString } from './shared/qql-builder'
import { resolveVendorRef } from './shared/resolve-vendor-ref'

interface FindQuickbooksVendorInput {
  email?: string
  displayName?: string
}

interface FindQuickbooksVendorOutput {
  found: boolean
  vendor: (MappedVendorDetail & { auxxCompanyId: string | null }) | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export default async function findQuickbooksVendor(
  input: FindQuickbooksVendorInput,
  ctx: ToolExecuteContext
): Promise<FindQuickbooksVendorOutput> {
  if (Number(!!input.email) + Number(!!input.displayName) !== 1) {
    invalidInput('Provide exactly one of email or displayName.')
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const where = input.email
    ? `PrimaryEmailAddr = ${quoteQqlString(input.email)}`
    : `DisplayName = ${quoteQqlString(input.displayName!)}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matches = await quickbooksQuery<any>(realmId, 'Vendor', credential, {
    where,
    limit: 1,
    sandbox,
  })

  if (matches.length === 0) {
    return { found: false, vendor: null, notImportedReason: null }
  }

  const raw = matches[0]
  const mapped = mapVendorDetail(raw)
  const auxxCompanyId = await resolveVendorRef(mapped.vendorId)

  return {
    found: true,
    vendor: { ...mapped, auxxCompanyId },
    notImportedReason: auxxCompanyId ? null : 'NOT_IMPORTED',
  }
}
