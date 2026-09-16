// src/tools/list_affirm_settlement_events.tool.server.ts

import { getAffirmCredentials } from './shared/connection'
import {
  type ProjectedSettlementEvent,
  fetchSettlementEvents,
  groupByDeposit,
  projectSettlementEvent,
  widenSettlementWindow,
} from './shared/settlements'

interface ListAffirmSettlementEventsInput {
  after?: string
  before?: string
  depositId?: string
  limit?: number
  cursor?: string
}

function summarize(
  events: ProjectedSettlementEvent[],
  rejected: number,
  depositId: string | undefined,
  hasMore: boolean
): string {
  if (events.length === 0 && rejected === 0) {
    return depositId
      ? `No settlement events for deposit ${depositId} on this page of the date window.`
      : 'No Affirm settlement events in that range.'
  }

  const unknown = events.filter((e) => e.type === 'unknown').length
  const unassigned = events.filter((e) => e.depositId === null).length
  const kinds = [...new Set(events.map((e) => e.providerType))].join(', ')

  return (
    `${events.length} settlement event${events.length === 1 ? '' : 's'}` +
    (depositId ? ` for deposit ${depositId}` : '') +
    (kinds ? `. Event types: ${kinds}` : '') +
    '. ' +
    (unassigned ? `${unassigned} belong to no deposit. ` : '') +
    (unknown ? `${unknown} have an event type this app does not map; report them. ` : '') +
    (rejected ? `${rejected} row(s) could not be read and are omitted. ` : '') +
    (hasMore
      ? 'MORE PAGES REMAIN — this is not the complete set.'
      : 'This is the last page of the range.')
  )
}

export default async function listAffirmSettlementEvents(input: ListAffirmSettlementEventsInput) {
  const credentials = getAffirmCredentials()

  // Affirm's events endpoint has NO deposit_id filter, so a deposit lookup is a
  // date-window read that is grouped locally — and the window is widened by a
  // day either side, because a settlement's date and its events' dates diverge
  // (that is what Affirm's own `effective_date` field admits).
  const widened =
    input.depositId && input.after && !input.before ? widenSettlementWindow(input.after) : null

  const page = await fetchSettlementEvents(credentials, {
    after: widened?.after ?? input.after,
    before: widened?.before ?? input.before,
    limit: input.limit,
    page: input.cursor ?? null,
  })

  const rows = input.depositId ? groupByDeposit(page.rows, input.depositId) : page.rows
  const events: ProjectedSettlementEvent[] = []
  let rejected = 0
  for (const raw of rows) {
    try {
      events.push(projectSettlementEvent(raw))
    } catch {
      rejected += 1
    }
  }

  return {
    summary: summarize(events, rejected, input.depositId, page.nextPage !== null),
    events,
    rejected,
    // Honest about what was actually scanned, since the filter was local.
    scannedAfter: widened?.after ?? input.after ?? null,
    scannedBefore: widened?.before ?? input.before ?? null,
    // A deposit's membership is only complete once the WHOLE window is paged.
    complete: page.nextPage === null,
    nextCursor: page.nextPage,
    hasMore: page.nextPage !== null,
  }
}
