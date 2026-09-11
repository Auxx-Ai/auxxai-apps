// src/triggers/tracking-changed/tracking-changed.server.ts

/**
 * Polling execute for `shipstation.tracking-changed`.
 *
 * The `fedex.shipment-tracker` analogue: a configured set of parcels is polled
 * through `GET /v2/tracking` and an event fires whenever a parcel's status code
 * differs from the one seen on the previous poll. Last-seen status lives in this
 * trigger's own polling state, so two workflows watching the same parcel each
 * observe every transition.
 *
 * Three things this borrows from the FedEx reference, for the same reasons:
 *
 * 1. **A terminal skip-set.** Once a parcel is delivered, dropped at a
 *    collection point or returned to sender it stops being polled. The
 *    configured list is static and never gets unwatched, so without this it
 *    burns API calls forever.
 * 2. **First sighting seeds silently.** A parcel with no previously recorded
 *    status records its status and emits nothing, so enabling the trigger never
 *    fires historical customer updates. Only transitions after that fire.
 * 3. **Provider errors never throw out of the execute.** A parcel whose lookup
 *    fails keeps its previous status, so the very next poll still sees the
 *    transition rather than skipping it.
 *
 * Unlike FedEx, ShipStation has no batch tracking endpoint: `/v2/tracking` takes
 * exactly one tracking number. The per-poll request budget is therefore a
 * round-robin window over the configured list rather than a hard truncation, so
 * a long list is covered across successive polls instead of starving its tail.
 */

import type { PollingExecuteResult, PollingState } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../tools/shared/connection'
import { shipstationApi } from '../../tools/shared/shipstation-api'

/** Requests per poll. One request per parcel; `/v2/tracking` has no batch form. */
const MAX_LOOKUPS_PER_RUN = 25

/**
 * Status codes after which a parcel will not change again. `DE` delivered and
 * `SP` delivered to a collection location are ShipStation's two done states;
 * a return to sender shows up as a detail code rather than a status code.
 */
const TERMINAL_STATUS_CODES: readonly string[] = ['DE', 'SP']

/** Detail codes that mean the parcel went back and is likewise finished. */
const TERMINAL_DETAIL_CODES: readonly string[] = ['RETURN_TO_SENDER', 'PARCEL_DISPOSED']

interface TriggerInput {
  trackingNumbers?: string
  carrierCode?: string
  statusCodes?: string[]
}

/** Persisted between polls. */
export interface TrackingChangedState {
  /** Status code last seen per tracking number. Absence means "never seen". */
  lastStatusByNumber?: Record<string, string>
  /** Tracking numbers that reached a terminal state and are no longer polled. */
  terminal?: string[]
  /** Round-robin offset into the configured list, so a long list is covered. */
  nextIndex?: number
}

/** A `/v2/tracking` scan event. */
interface TrackEvent {
  occurred_at?: string
  description?: string
  city_locality?: string
  state_province?: string
  postal_code?: string
  country_code?: string
}

/** The subset of `get_tracking_log_response_body` this trigger projects. */
interface TrackingResponse {
  tracking_number?: string
  tracking_url?: string
  status_code?: string
  status_detail_code?: string
  carrier_code?: string
  status_description?: string
  status_detail_description?: string
  carrier_status_code?: string
  carrier_status_description?: string
  ship_date?: string
  estimated_delivery_date?: string
  actual_delivery_date?: string
  exception_description?: string
  events?: TrackEvent[]
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

/** Split a comma/newline-separated string into deduped, trimmed tracking numbers. */
function parseNumbers(raw: string | undefined): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  for (const part of raw.split(/[\s,]+/)) {
    const number = part.trim()
    if (number) seen.add(number)
  }
  return [...seen]
}

/** True once the parcel will not move again. */
function isTerminal(tracking: TrackingResponse): boolean {
  const status = tracking.status_code ?? ''
  const detail = tracking.status_detail_code ?? ''
  return TERMINAL_STATUS_CODES.includes(status) || TERMINAL_DETAIL_CODES.includes(detail)
}

/** City, state and country of the most recent scan, where the carrier gives one. */
function lastLocation(tracking: TrackingResponse): { location: string; occurredAt: string } {
  const events = tracking.events ?? []
  const latest = events[events.length - 1]
  if (!latest) return { location: '', occurredAt: '' }
  const parts = [latest.city_locality, latest.state_province, latest.country_code]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
  return { location: parts.join(', '), occurredAt: latest.occurred_at ?? '' }
}

function buildEvent(
  trackingNumber: string,
  tracking: TrackingResponse,
  previousStatus: string
): Record<string, unknown> {
  const status = tracking.status_code ?? ''
  const detail = tracking.status_detail_code ?? ''
  const { location, occurredAt } = lastLocation(tracking)
  return {
    eventId: `shipstation-tracking-${trackingNumber}-${status}-${occurredAt}`,
    trackingNumber,
    carrierCode: tracking.carrier_code ?? '',
    previousStatus,
    status,
    statusDescription: tracking.status_description ?? '',
    statusDetailCode: detail,
    statusDetailDescription: tracking.status_detail_description ?? '',
    carrierStatusCode: tracking.carrier_status_code ?? '',
    carrierStatusDescription: tracking.carrier_status_description ?? '',
    location,
    occurredAt,
    estimatedDelivery: tracking.estimated_delivery_date ?? '',
    deliveredAt: tracking.actual_delivery_date ?? '',
    exceptionDescription: tracking.exception_description ?? '',
    trackingUrl: tracking.tracking_url ?? '',
    isDelivered: TERMINAL_STATUS_CODES.includes(status),
    isException: status === 'EX',
    isReturned: detail === 'RETURN_TO_SENDER',
  }
}

/**
 * The slice of `active` to poll this run, plus the offset to resume from. A
 * window rather than a truncation, so every configured parcel is reached within
 * `ceil(active.length / MAX_LOOKUPS_PER_RUN)` polls.
 */
function selectWindow(active: string[], start: number): { window: string[]; nextIndex: number } {
  if (active.length <= MAX_LOOKUPS_PER_RUN) {
    return { window: active, nextIndex: 0 }
  }
  const from = Number.isInteger(start) && start >= 0 ? start % active.length : 0
  const window: string[] = []
  for (let i = 0; i < MAX_LOOKUPS_PER_RUN; i++) {
    window.push(active[(from + i) % active.length] as string)
  }
  return { window, nextIndex: (from + MAX_LOOKUPS_PER_RUN) % active.length }
}

export default async function trackingChangedExecute(
  input: TriggerInput,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const previous = (polling.state as TrackingChangedState) ?? {}
  const lastStatusByNumber = previous.lastStatusByNumber ?? {}
  const terminal = new Set(previous.terminal ?? [])

  const configured = parseNumbers(input.trackingNumbers)
  const active = configured.filter((number) => !terminal.has(number))

  // Rebuilt from the configured list each poll, so a number removed from the
  // panel drops out of state instead of growing it forever.
  const nextStatusByNumber: Record<string, string> = {}
  for (const number of active) {
    const seen = lastStatusByNumber[number]
    if (seen !== undefined) nextStatusByNumber[number] = seen
  }
  const nextTerminal = [...terminal].filter((number) => configured.includes(number))

  if (active.length === 0) {
    return {
      events: [],
      state: { lastStatusByNumber: nextStatusByNumber, terminal: nextTerminal, nextIndex: 0 },
    }
  }

  let apiKey: string
  try {
    apiKey = resolveApiKey(polling)
  } catch {
    // Not connected yet. Every last-seen status is preserved above, so the next
    // poll still sees any transition that happened meanwhile.
    return {
      events: [],
      state: {
        lastStatusByNumber: nextStatusByNumber,
        terminal: nextTerminal,
        nextIndex: previous.nextIndex ?? 0,
      },
    }
  }

  const statusFilter = new Set((input.statusCodes ?? []).filter(Boolean))
  const carrierCode = input.carrierCode?.trim() || undefined
  const { window, nextIndex } = selectWindow(active, previous.nextIndex ?? 0)
  const events: Record<string, unknown>[] = []

  for (const trackingNumber of window) {
    let tracking: TrackingResponse
    try {
      tracking = await shipstationApi<TrackingResponse>('/tracking', apiKey, {
        carrier_code: carrierCode,
        tracking_number: trackingNumber,
      })
    } catch {
      // Failed lookup: the prior status is already carried in
      // `nextStatusByNumber`, so this parcel diffs against it next poll.
      continue
    }

    const status = tracking?.status_code ?? ''
    if (!status) continue

    const seen = lastStatusByNumber[trackingNumber]
    // First sighting seeds silently: record and emit nothing.
    const changed = seen !== undefined && seen !== status
    if (changed && (statusFilter.size === 0 || statusFilter.has(status))) {
      events.push(buildEvent(trackingNumber, tracking, seen))
    }

    if (isTerminal(tracking)) {
      // Final state: the event above is emitted, then the parcel stops being
      // polled. Drop its status entry so state does not carry both.
      if (!nextTerminal.includes(trackingNumber)) nextTerminal.push(trackingNumber)
      delete nextStatusByNumber[trackingNumber]
    } else {
      nextStatusByNumber[trackingNumber] = status
    }
  }

  return {
    events,
    state: { lastStatusByNumber: nextStatusByNumber, terminal: nextTerminal, nextIndex },
  }
}
