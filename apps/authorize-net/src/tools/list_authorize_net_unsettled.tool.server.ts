// src/tools/list_authorize_net_unsettled.tool.server.ts

import { getAuthorizeNetCredentials } from './shared/connection'
import {
  type ProjectedUnsettledTransaction,
  decodeCursor,
  encodeCursor,
  projectUnsettledTransaction,
} from './shared/projections'
import { AUTHORIZE_NET_PAGE_LIMIT, fetchUnsettledTransactions } from './shared/settlements'

interface ListAuthorizeNetUnsettledInput {
  limit?: number
  cursor?: string
}

function summarize(
  transactions: ProjectedUnsettledTransaction[],
  total: number,
  rejected: number,
  hasMore: boolean
): string {
  if (transactions.length === 0 && rejected === 0) {
    return 'No unsettled Authorize.net transactions — everything captured is in a settled batch.'
  }

  const statuses = [...new Set(transactions.map((t) => t.status))].join(', ')

  return (
    `${transactions.length} unsettled Authorize.net transaction` +
    `${transactions.length === 1 ? '' : 's'} of ${total} in total` +
    (statuses ? `. Statuses: ${statuses}` : '') +
    '. This is money not yet in the bank. ' +
    (rejected ? `${rejected} row(s) could not be read and are omitted. ` : '') +
    (hasMore ? 'MORE PAGES REMAIN — this is not the whole list.' : 'This is the last page.')
  )
}

export default async function listAuthorizeNetUnsettled(input: ListAuthorizeNetUnsettledInput) {
  const credentials = getAuthorizeNetCredentials()
  const limit = Math.min(input.limit ?? AUTHORIZE_NET_PAGE_LIMIT, AUTHORIZE_NET_PAGE_LIMIT)
  const page = decodeCursor(input.cursor)

  const result = await fetchUnsettledTransactions({ credentials, limit, offset: page })

  const transactions: ProjectedUnsettledTransaction[] = []
  let rejected = 0
  for (const raw of result.transactions) {
    const projected = projectUnsettledTransaction(raw)
    if (projected) transactions.push(projected)
    else rejected += 1
  }

  const hasMore = page * limit < result.total

  return {
    summary: summarize(transactions, result.total, rejected, hasMore),
    transactions,
    rejected,
    nextCursor: hasMore ? encodeCursor(page + 1) : null,
    hasMore,
    total: result.total,
  }
}
