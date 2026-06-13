// src/tools/shared/map-shipment.ts

/**
 * Maps a FedEx `trackResult` to our normalized {@link MappedShipment}. Used by
 * both track tools and the polling trigger so they always agree on shape +
 * status. Unknown codes degrade to `unknown` — the mapper never throws.
 */

import type { RawTrackResult } from './fedex-api'
import type { MappedShipment, ScanEvent, ShipmentStatusType } from './shipment-schema'

/** FedEx `derivedCode` (fallback `code`) → our normalized status. */
const STATUS_MAP: Record<string, ShipmentStatusType> = {
  OC: 'label_created',
  PU: 'picked_up',
  AR: 'in_transit',
  DP: 'in_transit',
  IT: 'in_transit',
  AO: 'in_transit',
  CC: 'in_transit',
  OD: 'out_for_delivery',
  DL: 'delivered',
  DE: 'exception',
  SE: 'exception',
  CD: 'exception', // clearance delay — for support, "stuck in customs" is an exception
  DY: 'exception', // delay
  RS: 'returned_to_shipper',
}

const SCAN_EVENT_CAP = 20

type Loc = { city?: string; stateOrProvinceCode?: string; countryCode?: string } | undefined

/** Parse FedEx's mixed offset/`Z` timestamps to UTC ISO; null on missing/invalid. */
function toUtcIso(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/** "City, ST, US" — skips empty parts; null when nothing is present. */
function formatLocation(loc: Loc): string | null {
  if (!loc) return null
  const parts = [loc.city, loc.stateOrProvinceCode, loc.countryCode].filter((p): p is string =>
    Boolean(p)
  )
  return parts.length ? parts.join(', ') : null
}

function dateAndTime(tr: RawTrackResult, type: string): string | null {
  const list = (tr.dateAndTimes as Array<{ type?: string; dateTime?: string }> | undefined) ?? []
  const match = list.find((d) => d.type === type)
  return match ? toUtcIso(match.dateTime) : null
}

/** Ship date as epoch ms for sorting reused numbers; 0 when absent. */
function shipDateMs(tr: RawTrackResult): number {
  const iso = dateAndTime(tr, 'SHIP')
  return iso ? Date.parse(iso) : 0
}

/**
 * FedEx recycles tracking numbers, so a single number can return multiple
 * `trackResults`. Pick the usable one with the most recent ship date.
 */
export function selectTrackResult(trackResults: RawTrackResult[]): RawTrackResult | null {
  const usable = trackResults.filter((tr) => !tr.error && tr.latestStatusDetail)
  if (!usable.length) return null
  return usable.slice().sort((a, b) => shipDateMs(b) - shipDateMs(a))[0]
}

function mapScanEvents(tr: RawTrackResult): ScanEvent[] {
  const raw =
    (tr.scanEvents as
      | Array<{
          date?: string
          eventDescription?: string
          scanLocation?: Loc
        }>
      | undefined) ?? []
  return raw
    .map((e) => ({
      date: toUtcIso(e.date),
      location: formatLocation(e.scanLocation),
      description: e.eventDescription ?? '',
    }))
    .sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0))
    .slice(0, SCAN_EVENT_CAP)
}

function isDelayed(tr: RawTrackResult): boolean {
  const raw = (tr.scanEvents as Array<{ delayDetail?: { status?: string } }> | undefined) ?? []
  return raw.some((e) => e.delayDetail?.status === 'DELAYED')
}

/**
 * Map a number's raw `trackResults` to a normalized shipment.
 * `found: false` when FedEx has no usable result (not-found, or empty).
 */
export function mapShipment(
  trackingNumber: string,
  trackResults: RawTrackResult[]
): { found: boolean; shipment: MappedShipment | null } {
  const tr = selectTrackResult(trackResults)
  if (!tr) return { found: false, shipment: null }

  const status = (tr.latestStatusDetail ?? {}) as {
    code?: string
    derivedCode?: string
    statusByLocale?: string
    description?: string
    scanLocation?: Loc
  }
  const statusCode = status.derivedCode ?? status.code ?? ''
  const statusType = STATUS_MAP[statusCode] ?? 'unknown'

  const window = (
    tr.estimatedDeliveryTimeWindow as { window?: { begins?: string; ends?: string } } | undefined
  )?.window
  const windowBegins = toUtcIso(window?.begins)
  const windowEnds = toUtcIso(window?.ends)
  const estimatedDeliveryWindow =
    windowBegins && windowEnds ? { begins: windowBegins, ends: windowEnds } : null

  const scanEvents = mapScanEvents(tr)
  const latest = scanEvents[0] ?? null

  const service = (tr.serviceDetail as { description?: string } | undefined)?.description ?? null
  const receivedByName =
    (tr.deliveryDetails as { receivedByName?: string } | undefined)?.receivedByName ?? null

  return {
    found: true,
    shipment: {
      trackingNumber,
      statusType,
      statusCode,
      statusDescription: status.statusByLocale ?? status.description ?? statusCode,
      estimatedDelivery: windowBegins ?? dateAndTime(tr, 'ESTIMATED_DELIVERY'),
      estimatedDeliveryWindow,
      deliveredAt: dateAndTime(tr, 'ACTUAL_DELIVERY'),
      isDelayed: isDelayed(tr),
      lastActivity: latest
        ? { date: latest.date, location: latest.location, description: latest.description }
        : null,
      service,
      receivedByName,
      scanEvents,
    },
  }
}
