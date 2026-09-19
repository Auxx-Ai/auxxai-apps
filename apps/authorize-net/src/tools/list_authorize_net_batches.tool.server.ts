// src/tools/list_authorize_net_batches.tool.server.ts

import { getAuthorizeNetCredentials } from './shared/connection'
import { type ProjectedBatch, projectBatch } from './shared/projections'
import {
  AUTHORIZE_NET_MAX_WINDOW_DAYS,
  fetchSettledBatches,
  settlementWindows,
} from './shared/settlements'

interface ListAuthorizeNetBatchesInput {
  after?: string
  before?: string
}

/** Batches returned in one call. A wider range is split, not refused. */
const MAX_BATCHES = 250

/** Default span when no `after` is given, in days. One `getSettledBatchList` call. */
const DEFAULT_SPAN_DAYS = AUTHORIZE_NET_MAX_WINDOW_DAYS - 1

function shiftDate(date: string, days: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`)
  if (!Number.isFinite(ms)) throw new Error(`Not a settlement date: ${date}`)
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10)
}

function summarize(batches: ProjectedBatch[], rejected: number, hasMore: boolean): string {
  if (batches.length === 0 && rejected === 0)
    return 'No Authorize.net batches settled in that range.'

  const dates = batches.map((b) => b.settledOn).sort()
  const notSettled = batches.filter((b) => b.state !== 'settledSuccessfully').length
  const currencies = [...new Set(batches.map((b) => b.currency))]

  return (
    `${batches.length} Authorize.net batch${batches.length === 1 ? '' : 'es'}` +
    (dates.length ? ` settled from ${dates[0]} to ${dates[dates.length - 1]}` : '') +
    (currencies.length === 1 ? ` in ${currencies[0]}` : '') +
    '. Each amount is the sum of that batch’s per-card-brand statistics and is GROSS — card ' +
    'fees are billed monthly and are not in these figures. ' +
    (notSettled ? `${notSettled} did not settle successfully (see state). ` : '') +
    (rejected ? `${rejected} row(s) could not be read and are omitted. ` : '') +
    (hasMore
      ? 'MORE BATCHES MATCH — narrow the date range to see them.'
      : 'This is the whole range.')
  )
}

export default async function listAuthorizeNetBatches(input: ListAuthorizeNetBatchesInput) {
  const credentials = getAuthorizeNetCredentials()

  const before = input.before ?? new Date().toISOString().slice(0, 10)
  const after = input.after ?? shiftDate(before, -DEFAULT_SPAN_DAYS)

  // The 31-day cap means a wider range is paged over windows, not refused.
  const windows = settlementWindows(after, before, AUTHORIZE_NET_MAX_WINDOW_DAYS)

  const batches: ProjectedBatch[] = []
  let rejected = 0
  let hasMore = false

  for (const window of windows) {
    if (batches.length >= MAX_BATCHES) {
      hasMore = true
      break
    }
    const rows = await fetchSettledBatches({
      credentials,
      first: window.first,
      last: window.last,
      includeStatistics: true,
    })
    for (const raw of rows) {
      const batch = projectBatch(raw)
      if (batch) batches.push(batch)
      else rejected += 1
    }
  }

  return {
    summary: summarize(batches, rejected, hasMore),
    batches: batches.slice(0, MAX_BATCHES),
    rejected,
    hasMore: hasMore || batches.length > MAX_BATCHES,
  }
}
