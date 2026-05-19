// src/tools/search-quickbooks-vendors.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapVendorSummary, type MappedVendorSummary } from './shared/map-vendor'
import { joinWhere, quoteQqlString } from './shared/qql-builder'
import { resolveVendorRef } from './shared/resolve-vendor-ref'

interface SearchQuickbooksVendorsInput {
  query?: string
  activeOnly?: boolean
  limit?: number
}

interface SearchQuickbooksVendorsOutput {
  vendors: (MappedVendorSummary & { auxxCompanyId: string | null })[]
  hasMore: boolean
}

export default async function searchQuickbooksVendors(
  input: SearchQuickbooksVendorsInput,
  ctx: ToolExecuteContext
): Promise<SearchQuickbooksVendorsOutput> {
  const limit = input.limit ?? 20
  const activeOnly = input.activeOnly !== false
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const where = joinWhere([
    activeOnly ? 'Active = true' : null,
    input.query ? `DisplayName LIKE ${quoteQqlString(`%${input.query}%`)}` : null,
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Vendor', credential, {
    where,
    limit: limit + 1,
    sandbox,
  })

  const hasMore = raw.length > limit
  const trimmed = hasMore ? raw.slice(0, limit) : raw

  const vendors = await Promise.all(
    trimmed.map(async (v) => {
      const mapped = mapVendorSummary(v)
      const auxxCompanyId = await resolveVendorRef(ctx, mapped.vendorId)
      return { ...mapped, auxxCompanyId }
    })
  )

  return { vendors, hasMore }
}
