// src/tools/list_affirm_settlements.tool.server.ts

import { getAffirmCredentials } from './shared/connection'
import { type ProjectedSettlement, fetchSettlements, projectSettlement } from './shared/settlements'

interface ListAffirmSettlementsInput {
  after?: string
  before?: string
  limit?: number
  cursor?: string
}

/**
 * A rollup the model can quote rather than re-deriving from the rows. Without
 * one, a list response tends to get collapsed into "here are your deposits"
 * with the amounts dropped — which is the only part that matters.
 */
function summarize(settlements: ProjectedSettlement[], rejected: number, hasMore: boolean): string {
  if (settlements.length === 0 && rejected === 0) return 'No Affirm settlements in that range.'

  const currencies = [...new Set(settlements.map((s) => s.currency))]
  const dates = settlements.map((s) => s.date).sort()
  const notPaid = settlements.filter((s) => s.status !== 'paid').length

  return (
    `${settlements.length} Affirm deposit${settlements.length === 1 ? '' : 's'}` +
    (dates.length ? ` from ${dates[0]} to ${dates[dates.length - 1]}` : '') +
    (currencies.length === 1 ? ` in ${currencies[0]}` : '') +
    '. ' +
    (notPaid ? `${notPaid} not settled (see status). ` : '') +
    (rejected ? `${rejected} row(s) could not be read and are omitted. ` : '') +
    (hasMore ? 'More pages available.' : 'This is the last page.')
  )
}

export default async function listAffirmSettlements(input: ListAffirmSettlementsInput) {
  const credentials = getAffirmCredentials()
  const page = await fetchSettlements(credentials, {
    after: input.after,
    before: input.before,
    limit: input.limit,
    page: input.cursor ?? null,
  })

  const settlements: ProjectedSettlement[] = []
  let rejected = 0
  for (const raw of page.rows) {
    try {
      settlements.push(projectSettlement(raw))
    } catch {
      // A row that will not translate is counted, never invented. The
      // connector retains the same row with its rejection reason.
      rejected += 1
    }
  }

  return {
    summary: summarize(settlements, rejected, page.nextPage !== null),
    settlements,
    rejected,
    nextCursor: page.nextPage,
    hasMore: page.nextPage !== null,
  }
}
