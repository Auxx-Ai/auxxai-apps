// src/tools/search-quickbooks-estimates.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapEstimateSummary, type MappedEstimateSummary } from './shared/map-estimate'
import { joinWhere, quoteQqlString, validateIsoDate, validateQbId } from './shared/qql-builder'

interface SearchQuickbooksEstimatesInput {
  customerId?: string
  status?: 'pending' | 'accepted' | 'closed' | 'rejected' | 'all'
  since?: string
  until?: string
  limit?: number
}

interface SearchQuickbooksEstimatesOutput {
  estimates: MappedEstimateSummary[]
  hasMore: boolean
}

const STATUS_MAP: Record<string, string> = {
  accepted: 'Accepted',
  closed: 'Closed',
  rejected: 'Rejected',
  pending: 'Pending',
}

export default async function searchQuickbooksEstimates(
  input: SearchQuickbooksEstimatesInput
): Promise<SearchQuickbooksEstimatesOutput> {
  const limit = input.limit ?? 20
  const status = input.status ?? 'all'

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const clauses: (string | null)[] = []
  if (input.customerId) {
    validateQbId(input.customerId, 'customerId')
    clauses.push(`CustomerRef = ${quoteQqlString(input.customerId)}`)
  }
  if (input.since)
    clauses.push(`TxnDate >= ${quoteQqlString(validateIsoDate(input.since, 'since'))}`)
  if (input.until)
    clauses.push(`TxnDate <= ${quoteQqlString(validateIsoDate(input.until, 'until'))}`)
  if (status !== 'all') clauses.push(`TxnStatus = ${quoteQqlString(STATUS_MAP[status])}`)

  const where = joinWhere(clauses)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Estimate', credential, {
    where,
    limit: limit + 1,
    sandbox,
  })

  const hasMore = raw.length > limit
  const trimmed = hasMore ? raw.slice(0, limit) : raw

  return { estimates: trimmed.map(mapEstimateSummary), hasMore }
}
