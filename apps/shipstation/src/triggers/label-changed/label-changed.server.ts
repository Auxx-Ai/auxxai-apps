// src/triggers/label-changed/label-changed.server.ts

/**
 * Polling execute for `shipstation.label-changed` — one trigger, two cursors.
 *
 * Why two: `GET /v2/labels` offers no `modified_at_start` filter and never
 * returns `modified_at` on a label object, so a single `modified_at` delta
 * cannot be written (the stop value would be a field the API sorts on and never
 * hands back). Two deltas whose watermark the response does carry are used
 * instead:
 *
 * - **created** — `created_at_start=<w1>`, `sort_by=created_at`, `sort_dir=asc`,
 *   paging forward. Ascending, so a partial read is safe: the cursor advances
 *   only to what was actually emitted.
 * - **voided** — `label_status=voided`, `sort_by=voided_at`, `sort_dir=desc`,
 *   stopping at the first label whose `voided_at` is at or before `<w2>`.
 *   Descending, so a partial read is NOT safe to check point: everything between
 *   the last row read and the watermark would be skipped. The rule is therefore
 *   "advance `w2` only when the scan actually reached the watermark"; when it
 *   did not (page cap or upstream error) the watermark is held and the label ids
 *   already emitted are carried in state so the next poll does not duplicate
 *   them. New voids still fire on every poll in that state, because a desc scan
 *   always starts at the newest.
 *
 * Initial backfill is separated from notification: the first poll sets both
 * watermarks to "now", makes no request and emits nothing, so enabling the
 * trigger never replays the account's label history.
 *
 * Provider errors never throw out of the execute.
 */

import type { PollingExecuteResult, PollingState } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../tools/shared/connection'
import { shipstationApi } from '../../tools/shared/shipstation-api'

const PAGE_SIZE = 100

/** Request budget per branch, per poll. */
const MAX_PAGES_PER_RUN = 5

/**
 * Ceiling on the carried de-duplication set. Only ever populated when a void
 * scan could not reach its watermark, and bounded by one poll's page budget.
 */
const MAX_TRACKED_VOID_IDS = MAX_PAGES_PER_RUN * PAGE_SIZE

type ChangeType = 'created' | 'voided'

interface TriggerInput {
  changeTypes?: string[]
  carrierId?: string
  serviceCode?: string
  warehouseId?: string
}

/** Persisted between polls. */
export interface LabelChangedState {
  /** ISO 8601. Greatest `created_at` emitted by the created branch. */
  createdAtWatermark?: string
  /** ISO 8601. Greatest `voided_at` emitted by a void scan that reached it. */
  voidedAtWatermark?: string
  /**
   * Label ids already emitted as voids above `voidedAtWatermark`. Non-empty only
   * while a void scan is behind; cleared as soon as one completes.
   */
  voidedEmittedIds?: string[]
}

/** The subset of the V2 `label` object this trigger projects. */
interface ShipStationLabel {
  label_id?: string
  shipment_id?: string
  external_shipment_id?: string
  external_order_id?: string
  carrier_code?: string
  carrier_id?: string
  service_code?: string
  tracking_number?: string
  status?: string
  tracking_status?: string
  is_return_label?: boolean
  voided?: boolean
  voided_at?: string | null
  void_type?: string
  ship_date?: string
  created_at?: string
  packages?: { tracking_number?: string }[]
}

interface ListLabelsResponse {
  labels?: ShipStationLabel[]
  page?: number
  pages?: number
  total?: number
}

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

function optional(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim()
  return trimmed ? trimmed : undefined
}

/** Panel filters that apply identically to both branches. */
function commonQuery(input: TriggerInput): Record<string, string | undefined> {
  return {
    carrier_id: optional(input.carrierId),
    service_code: optional(input.serviceCode),
    warehouse_id: optional(input.warehouseId),
  }
}

/** Project a V2 label onto the trigger's declared outputs. */
function buildEvent(label: ShipStationLabel, changeType: ChangeType): Record<string, unknown> {
  const trackingNumbers = (label.packages ?? [])
    .map((pkg) => pkg?.tracking_number ?? '')
    .filter(Boolean)
  const stamp = changeType === 'voided' ? (label.voided_at ?? '') : (label.created_at ?? '')
  return {
    eventId: `shipstation-label-${changeType}-${label.label_id ?? ''}-${stamp}`,
    changeType,
    labelId: label.label_id ?? '',
    shipmentId: label.shipment_id ?? '',
    externalShipmentId: label.external_shipment_id ?? '',
    externalOrderId: label.external_order_id ?? '',
    carrierCode: label.carrier_code ?? '',
    carrierId: label.carrier_id ?? '',
    serviceCode: label.service_code ?? '',
    trackingNumber: label.tracking_number ?? '',
    trackingNumbers: trackingNumbers.join(', '),
    packageCount: (label.packages ?? []).length,
    labelStatus: label.status ?? '',
    trackingStatus: label.tracking_status ?? '',
    isReturnLabel: label.is_return_label === true,
    voided: label.voided === true,
    voidedAt: label.voided_at ?? '',
    voidType: label.void_type ?? '',
    shipDate: label.ship_date ?? '',
    createdAt: label.created_at ?? '',
  }
}

interface CreatedScan {
  events: Record<string, unknown>[]
  watermark: string
}

/**
 * Ascending scan over `created_at`. A partial read is safe here: the cursor is
 * only ever advanced to a row that was emitted, so the unread remainder is
 * picked up next poll.
 */
async function scanCreated(
  apiKey: string,
  input: TriggerInput,
  watermark: string
): Promise<CreatedScan> {
  const events: Record<string, unknown>[] = []
  let highWater = watermark

  for (let page = 1; page <= MAX_PAGES_PER_RUN; page++) {
    let body: ListLabelsResponse
    try {
      body = await shipstationApi<ListLabelsResponse>('/labels', apiKey, {
        ...commonQuery(input),
        created_at_start: watermark,
        sort_by: 'created_at',
        sort_dir: 'asc',
        page,
        page_size: PAGE_SIZE,
      })
    } catch {
      return { events, watermark: highWater }
    }

    const rows = body?.labels ?? []
    if (rows.length === 0) break

    for (const row of rows) {
      const createdAt = row.created_at ?? ''
      if (!createdAt) continue
      if (createdAt > highWater) highWater = createdAt
      // `created_at_start` is inclusive, so the label that set the previous
      // watermark comes back on every poll.
      if (createdAt <= watermark) continue
      events.push(buildEvent(row, 'created'))
    }

    const pages = body?.pages ?? 1
    if (page >= pages) break
  }

  return { events, watermark: highWater }
}

interface VoidedScan {
  events: Record<string, unknown>[]
  watermark: string
  emittedIds: string[]
}

/**
 * Descending scan over `voided_at`, stopping at the first label at or before the
 * watermark. The watermark advances ONLY on a scan that reached it; otherwise it
 * is held and the ids already emitted are returned so the next poll suppresses
 * them instead of firing duplicates.
 */
async function scanVoided(
  apiKey: string,
  input: TriggerInput,
  watermark: string,
  alreadyEmitted: ReadonlySet<string>
): Promise<VoidedScan> {
  const events: Record<string, unknown>[] = []
  const seen: string[] = []
  let newest = watermark
  let reachedWatermark = false

  for (let page = 1; page <= MAX_PAGES_PER_RUN && !reachedWatermark; page++) {
    let body: ListLabelsResponse
    try {
      body = await shipstationApi<ListLabelsResponse>('/labels', apiKey, {
        ...commonQuery(input),
        label_status: 'voided',
        sort_by: 'voided_at',
        sort_dir: 'desc',
        page,
        page_size: PAGE_SIZE,
      })
    } catch {
      // Upstream failure mid-scan: hold the watermark, carry the ids.
      return { events, watermark, emittedIds: capIds([...alreadyEmitted, ...seen]) }
    }

    const rows = body?.labels ?? []
    if (rows.length === 0) {
      reachedWatermark = true
      break
    }

    for (const row of rows) {
      const voidedAt = row.voided_at ?? ''
      // A voided label with no timestamp cannot be placed against the cursor.
      if (!voidedAt) continue
      if (voidedAt <= watermark) {
        reachedWatermark = true
        break
      }
      if (voidedAt > newest) newest = voidedAt
      const labelId = row.label_id ?? ''
      seen.push(labelId)
      if (alreadyEmitted.has(labelId)) continue
      events.push(buildEvent(row, 'voided'))
    }

    const pages = body?.pages ?? 1
    if (page >= pages) reachedWatermark = true
  }

  if (reachedWatermark) {
    // Everything above the old watermark has now been read, so the cursor can
    // move and the carried de-duplication set is no longer needed.
    return { events, watermark: newest, emittedIds: [] }
  }

  // Page cap reached with the watermark still below the last row read. Advancing
  // would skip the unread middle, so hold and de-duplicate instead.
  return { events, watermark, emittedIds: capIds([...alreadyEmitted, ...seen]) }
}

/** Keep the carried id set bounded and unique, newest-first. */
function capIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))].slice(0, MAX_TRACKED_VOID_IDS)
}

export default async function labelChangedExecute(
  input: TriggerInput,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const previous = (polling.state as LabelChangedState) ?? {}
  const createdWatermark = previous.createdAtWatermark
  const voidedWatermark = previous.voidedAtWatermark

  // First run: establish both cursors, emit nothing, make no request.
  if (!createdWatermark || !voidedWatermark) {
    const start = nowIso()
    return {
      events: [],
      state: {
        createdAtWatermark: createdWatermark ?? start,
        voidedAtWatermark: voidedWatermark ?? start,
        voidedEmittedIds: previous.voidedEmittedIds ?? [],
      },
    }
  }

  const unchanged = {
    createdAtWatermark: createdWatermark,
    voidedAtWatermark: voidedWatermark,
    voidedEmittedIds: previous.voidedEmittedIds ?? [],
  }

  let apiKey: string
  try {
    apiKey = resolveApiKey(polling)
  } catch {
    return { events: [], state: unchanged }
  }

  const wanted = new Set((input.changeTypes ?? []).filter(Boolean))
  const wantCreated = wanted.size === 0 || wanted.has('created')
  const wantVoided = wanted.size === 0 || wanted.has('voided')

  const events: Record<string, unknown>[] = []
  const state: LabelChangedState = { ...unchanged }

  if (wantCreated) {
    const created = await scanCreated(apiKey, input, createdWatermark)
    events.push(...created.events)
    state.createdAtWatermark = created.watermark
  } else {
    // Branch switched off. Keep its cursor at "now" so switching it back on
    // later starts from that moment instead of replaying everything since the
    // trigger was first enabled.
    state.createdAtWatermark = nowIso()
  }

  if (wantVoided) {
    const voided = await scanVoided(
      apiKey,
      input,
      voidedWatermark,
      new Set(previous.voidedEmittedIds ?? [])
    )
    events.push(...voided.events)
    state.voidedAtWatermark = voided.watermark
    state.voidedEmittedIds = voided.emittedIds
  } else {
    state.voidedAtWatermark = nowIso()
    state.voidedEmittedIds = []
  }

  return { events, state: state as Record<string, unknown> }
}
