// src/triggers/shipment-changed/shipment-changed.server.ts

/**
 * Polling execute for `shipstation.shipment-changed`.
 *
 * One cursor: the greatest `modified_at` seen. `GET /v2/shipments` accepts
 * `modified_at_start` and returns `modified_at` on every shipment, so this is a
 * true delta rather than a snapshot diff.
 *
 * Three rules, all from the plan:
 *
 * 1. **Initial backfill is separated from notification.** On the very first
 *    poll the watermark is set to "now" and NO events are emitted and no
 *    request is made. Enabling the trigger therefore never replays the account's
 *    shipment history at the customer. Everything modified after that instant
 *    fires normally.
 * 2. **The checkpoint never advances past a window that was not read.** The
 *    scan is ascending, so on an upstream failure the watermark is left at the
 *    greatest `modified_at` actually emitted (unchanged when page 1 fails), and
 *    the unread remainder is picked up on the next poll.
 * 3. **Requests are budgeted.** At most `MAX_PAGES_PER_RUN` pages per poll. When
 *    the cap is reached the run returns with the watermark it earned rather than
 *    looping; the next poll resumes from there.
 *
 * Provider errors never throw out of the execute.
 */

import type { PollingExecuteResult, PollingState } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../tools/shared/connection'
import { shipstationApi } from '../../tools/shared/shipstation-api'

/** ShipStation's documented default is 25; 100 keeps a busy account inside the page cap. */
const PAGE_SIZE = 100

/** Request budget per poll. 5 x 100 shipments is far beyond a normal poll window. */
const MAX_PAGES_PER_RUN = 5

interface TriggerInput {
  storeId?: string
  shipmentStatus?: string
  tag?: string
}

/** Persisted between polls. */
export interface ShipmentChangedState {
  /** ISO 8601. Greatest `modified_at` handed to a workflow so far. */
  modifiedAtWatermark?: string
}

/** The subset of the V2 `shipment` object this trigger projects. */
interface ShipStationShipment {
  shipment_id?: string
  shipment_number?: string
  external_shipment_id?: string
  external_order_id?: string
  sales_order_id?: string
  shipment_status?: string
  store_id?: string
  warehouse_id?: string
  carrier_id?: string
  service_code?: string
  ship_to?: { name?: string }
  tags?: { name?: string }[]
  is_return?: boolean
  ship_date?: string
  created_at?: string
  modified_at?: string
}

interface ListShipmentsResponse {
  shipments?: ShipStationShipment[]
  page?: number
  pages?: number
  total?: number
}

/** Current instant as an ISO 8601 string, the shape ShipStation's date filters take. */
function nowIso(): string {
  return new Date().toISOString()
}

/**
 * The V2 API key for this poll. `polling.connection` is the platform's own
 * injection; `getShipstationApiKey()` is the ambient fallback the tools use.
 */
function resolveApiKey(polling: PollingState): string {
  const injected = polling.connection?.value
  if (injected) return injected
  return getShipstationApiKey()
}

/** Trim a panel string to a query value, dropping blanks so they are not sent. */
function optional(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim()
  return trimmed ? trimmed : undefined
}

/** Project a V2 shipment onto the trigger's declared outputs. */
function buildEvent(shipment: ShipStationShipment): Record<string, unknown> {
  const modifiedAt = shipment.modified_at ?? ''
  return {
    eventId: `shipstation-shipment-${shipment.shipment_id ?? ''}-${modifiedAt}`,
    shipmentId: shipment.shipment_id ?? '',
    shipmentNumber: shipment.shipment_number ?? '',
    externalShipmentId: shipment.external_shipment_id ?? '',
    externalOrderId: shipment.external_order_id ?? '',
    salesOrderId: shipment.sales_order_id ?? '',
    shipmentStatus: shipment.shipment_status ?? '',
    storeId: shipment.store_id ?? '',
    warehouseId: shipment.warehouse_id ?? '',
    carrierId: shipment.carrier_id ?? '',
    serviceCode: shipment.service_code ?? '',
    shipToName: shipment.ship_to?.name ?? '',
    tags: (shipment.tags ?? [])
      .map((tag) => tag?.name ?? '')
      .filter(Boolean)
      .join(', '),
    isReturn: shipment.is_return === true,
    shipDate: shipment.ship_date ?? '',
    createdAt: shipment.created_at ?? '',
    modifiedAt,
  }
}

export default async function shipmentChangedExecute(
  input: TriggerInput,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const previous = (polling.state as ShipmentChangedState) ?? {}
  const watermark = previous.modifiedAtWatermark

  // First run: establish the cursor, emit nothing. This is the backfill /
  // notification split — enabling the trigger must not fire history.
  if (!watermark) {
    return { events: [], state: { modifiedAtWatermark: nowIso() } }
  }

  let apiKey: string
  try {
    apiKey = resolveApiKey(polling)
  } catch {
    // Not connected yet. Hold the checkpoint; nothing was read.
    return { events: [], state: { modifiedAtWatermark: watermark } }
  }

  const events: Record<string, unknown>[] = []
  let highWater = watermark

  for (let page = 1; page <= MAX_PAGES_PER_RUN; page++) {
    let body: ListShipmentsResponse
    try {
      body = await shipstationApi<ListShipmentsResponse>('/shipments', apiKey, {
        modified_at_start: watermark,
        sort_by: 'modified_at',
        sort_dir: 'asc',
        page,
        page_size: PAGE_SIZE,
        store_id: optional(input.storeId),
        shipment_status: optional(input.shipmentStatus),
        tag: optional(input.tag),
      })
    } catch {
      // Upstream failure. Keep what was already read and stop at the boundary
      // we reached; never jump over the unread remainder.
      return { events, state: { modifiedAtWatermark: highWater } }
    }

    const rows = body?.shipments ?? []
    if (rows.length === 0) break

    for (const row of rows) {
      const modifiedAt = row.modified_at ?? ''
      if (!modifiedAt) continue
      if (modifiedAt > highWater) highWater = modifiedAt
      // `modified_at_start` is inclusive, so the shipment that set the previous
      // watermark comes back on every poll. Emitting it again would duplicate.
      if (modifiedAt <= watermark) continue
      events.push(buildEvent(row))
    }

    const pages = body?.pages ?? 1
    if (page >= pages) break
  }

  return { events, state: { modifiedAtWatermark: highWater } }
}
