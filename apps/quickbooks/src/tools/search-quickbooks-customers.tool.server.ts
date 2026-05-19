// src/tools/search-quickbooks-customers.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapCustomerSummary, type MappedCustomerSummary } from './shared/map-customer'
import { joinWhere, quoteQqlString } from './shared/qql-builder'
import { resolveCustomerRefs } from './shared/resolve-customer-refs'

interface SearchQuickbooksCustomersInput {
  query?: string
  activeOnly?: boolean
  limit?: number
}

interface SearchQuickbooksCustomersOutput {
  customers: (MappedCustomerSummary & {
    auxxContactId: string | null
    auxxCompanyId: string | null
  })[]
  hasMore: boolean
}

export default async function searchQuickbooksCustomers(
  input: SearchQuickbooksCustomersInput,
  ctx: ToolExecuteContext
): Promise<SearchQuickbooksCustomersOutput> {
  const limit = input.limit ?? 20
  const activeOnly = input.activeOnly !== false
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const where = joinWhere([
    activeOnly ? 'Active = true' : null,
    input.query ? `DisplayName LIKE ${quoteQqlString(`%${input.query}%`)}` : null,
  ])

  // Fetch limit+1 to detect hasMore without a second count call.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Customer', credential, {
    where,
    limit: limit + 1,
    sandbox,
  })

  const hasMore = raw.length > limit
  const trimmed = hasMore ? raw.slice(0, limit) : raw

  const customers = await Promise.all(
    trimmed.map(async (c) => {
      const refs = await resolveCustomerRefs(ctx, c)
      return {
        ...mapCustomerSummary(c),
        auxxContactId: refs.auxxContactId,
        auxxCompanyId: refs.auxxCompanyId,
      }
    })
  )

  return { customers, hasMore }
}
