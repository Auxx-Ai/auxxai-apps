// src/tools/list_authorize_net_batch_transactions.tool.server.ts

import { getAuthorizeNetCredentials } from './shared/connection'
import {
  type ProjectedBatchTransaction,
  decodeCursor,
  encodeCursor,
  projectBatchTransaction,
} from './shared/projections'
import { AUTHORIZE_NET_PAGE_LIMIT, fetchBatchTransactions } from './shared/settlements'

interface ListAuthorizeNetBatchTransactionsInput {
  batchId: string
  limit?: number
  cursor?: string
}

function summarize(
  transactions: ProjectedBatchTransaction[],
  batchId: string,
  total: number,
  rejected: number,
  hasMore: boolean
): string {
  if (transactions.length === 0 && rejected === 0) {
    return `No transactions on this page of Authorize.net batch ${batchId}.`
  }

  const statuses = [...new Set(transactions.map((t) => t.status))].join(', ')

  return (
    `${transactions.length} transaction${transactions.length === 1 ? '' : 's'} in Authorize.net ` +
    `batch ${batchId} of ${total} in total` +
    (statuses ? `. Statuses: ${statuses}` : '') +
    '. Amounts are gross — card fees are billed monthly and are not deducted here. ' +
    (rejected ? `${rejected} row(s) could not be read and are omitted. ` : '') +
    (hasMore ? 'MORE PAGES REMAIN — this is not the whole batch.' : 'This is the last page.')
  )
}

export default async function listAuthorizeNetBatchTransactions(
  input: ListAuthorizeNetBatchTransactionsInput
) {
  const credentials = getAuthorizeNetCredentials()
  const limit = Math.min(input.limit ?? AUTHORIZE_NET_PAGE_LIMIT, AUTHORIZE_NET_PAGE_LIMIT)
  const page = decodeCursor(input.cursor)

  const result = await fetchBatchTransactions({
    credentials,
    batchId: input.batchId,
    limit,
    offset: page,
  })

  const transactions: ProjectedBatchTransaction[] = []
  let rejected = 0
  for (const raw of result.transactions) {
    const projected = projectBatchTransaction(raw)
    if (projected) transactions.push(projected)
    else rejected += 1
  }

  // `offset` is a 1-based page number, so rows read after this call are `page * limit`.
  const hasMore = page * limit < result.total

  return {
    summary: summarize(transactions, input.batchId, result.total, rejected, hasMore),
    transactions,
    rejected,
    nextCursor: hasMore ? encodeCursor(page + 1) : null,
    hasMore,
    total: result.total,
  }
}
