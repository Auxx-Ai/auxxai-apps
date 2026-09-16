// src/tools/list_affirm_charges.tool.server.ts

import { getAffirmCredentials } from './shared/connection'
import { type ProjectedCharge, fetchCharges, projectCharge } from './shared/transactions'

interface ListAffirmChargesInput {
  after?: string
  before?: string
  orderId?: string
  limit?: number
}

function summarize(charges: ProjectedCharge[], rejected: number, hasMore: boolean): string {
  if (charges.length === 0 && rejected === 0) return 'No Affirm charges in that range.'

  const statuses = [...new Set(charges.map((c) => c.status).filter(Boolean))].join(', ')
  const refunded = charges.filter((c) => c.amountRefunded !== null).length

  return (
    `${charges.length} Affirm charge${charges.length === 1 ? '' : 's'}` +
    (statuses ? `. Statuses: ${statuses}` : '') +
    '. ' +
    (refunded ? `${refunded} carry a refunded amount. ` : '') +
    (rejected ? `${rejected} could not be read and are omitted. ` : '') +
    (hasMore ? 'MORE CHARGES MATCH — narrow the date range to see them.' : 'This is the last page.')
  )
}

export default async function listAffirmCharges(input: ListAffirmChargesInput) {
  const credentials = getAffirmCredentials()
  // No `expand=checkout` here. An expanded checkout carries the customer's
  // name, email and address, and a list result has no business holding them.
  const page = await fetchCharges(credentials, {
    after: input.after,
    before: input.before,
    limit: input.limit,
  })

  const charges: ProjectedCharge[] = []
  let rejected = 0
  for (const raw of page.rows) {
    try {
      charges.push(projectCharge(raw))
    } catch {
      rejected += 1
    }
  }

  // Affirm has no order_id filter on this endpoint either, so this is local.
  const filtered = input.orderId ? charges.filter((c) => c.orderId === input.orderId) : charges

  return {
    summary: summarize(filtered, rejected, page.hasNext),
    charges: filtered,
    rejected,
    hasMore: page.hasNext,
  }
}
