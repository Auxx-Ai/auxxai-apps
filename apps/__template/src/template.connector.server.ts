// src/template.connector.server.ts
//
// EXAMPLE server handler for `template.connector.ts`. Runs inside the
// app-runtime sandbox. Replace `fetchItemsPage` with a real call to your
// provider. The contract: fetch exactly what `query` asks for, return ONE
// page plus `cursor` while more remain, and on the last page return `since`
// (the marker the next run gets back as `query.since`).

import {
  type ConnectorExecuteArgs,
  type ConnectorFetchResult,
  type ConnectorRecord,
  DeltaExpiredError,
} from '@auxx/sdk/data-connectors'

interface TemplateItem {
  id: string
  name: string
  updatedAt: string
  customer: { id: string; email: string }
}

interface ItemsPage {
  items: TemplateItem[]
  nextCursor?: string
  /** The provider's answer to a delta marker it no longer honours (a 410, say). */
  markerExpired?: boolean
}

const ITEMS: TemplateItem[] = [
  {
    id: '1',
    name: 'Example item',
    updatedAt: '2026-01-01T00:00:00Z',
    customer: { id: 'cust_1', email: 'jane@example.com' },
  },
]

/** Stand-in for the provider call: filter by ids and updated-after, one page. */
async function fetchItemsPage(filter: {
  ids?: string[]
  updatedAfter?: string
  cursor?: string
}): Promise<ItemsPage> {
  const items = ITEMS.filter(
    (item) =>
      (!filter.ids || filter.ids.includes(item.id)) &&
      (!filter.updatedAfter || item.updatedAt > filter.updatedAfter)
  )
  return { items }
}

function toRecord(item: TemplateItem): ConnectorRecord {
  return {
    streamKey: 'item',
    externalId: item.id,
    displayName: item.name,
    fields: { id: item.id, name: item.name, customer: item.customer },
  }
}

export default async function templateSync(
  args: ConnectorExecuteArgs
): Promise<ConnectorFetchResult> {
  const { streamKey, query, cursor } = args

  if (streamKey !== 'item') {
    throw new Error(`template.core: unknown stream "${streamKey}"`)
  }

  const since = typeof query.since === 'string' ? query.since : undefined
  const page = await fetchItemsPage({
    ids: query.ids,
    updatedAfter: since,
    cursor: typeof cursor === 'string' ? cursor : undefined,
  })
  if (page.markerExpired) throw new DeltaExpiredError(streamKey)

  const records = page.items.map(toRecord)
  if (page.nextCursor) return { records, cursor: page.nextCursor }

  // Last page: hand back the high-water mark, or the old one when nothing changed.
  const maxUpdatedAt = page.items.reduce<string | undefined>(
    (max, item) => (!max || item.updatedAt > max ? item.updatedAt : max),
    since
  )
  return { records, since: maxUpdatedAt }
}
