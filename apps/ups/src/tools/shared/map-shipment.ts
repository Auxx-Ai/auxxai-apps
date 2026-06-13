// src/tools/shared/map-shipment.ts

/**
 * Maps a raw UPS tracking `package` to our normalized {@link MappedShipment}.
 * Used by both the track tool and the polling trigger so they always agree on
 * shape + status. Unknown UPS `type` codes degrade to `unknown` — the mapper
 * never throws.
 */

import type { RawPackage } from './ups-api'
import type { MappedShipment, ScanEvent, ShipmentStatusType } from './shipment-schema'

/** UPS activity/status `type` → our normalized status (plan §5 table). */
const STATUS_MAP: Record<string, ShipmentStatusType> = {
  M: 'label_created', // manifest / label created
  P: 'picked_up',
  I: 'in_transit', // on the way (UPS folds out-for-delivery in here)
  X: 'exception',
  D: 'delivered',
  RS: 'returned_to_shipper',
}

const SCAN_EVENT_CAP = 20

interface UpsAddress {
  city?: string
  stateProvince?: string
  countryCode?: string
  country?: string
}

interface UpsActivity {
  date?: string
  time?: string
  gmtDate?: string
  gmtTime?: string
  location?: { address?: UpsAddress }
  status?: {
    code?: string
    description?: string
    simplifiedTextDescription?: string
    type?: string
  }
}

interface UpsStatus {
  code?: string
  description?: string
  simplifiedTextDescription?: string
  statusCode?: string
  type?: string
}

/** Parse UPS `YYYYMMDD` + `HHMMSS` (GMT) to a UTC ISO string; null on missing/invalid. */
function toUtcIso(date: unknown, time: unknown): string | null {
  if (typeof date !== 'string' || !/^\d{8}$/.test(date)) return null
  const t = typeof time === 'string' && /^\d{1,6}$/.test(time) ? time.padStart(6, '0') : '000000'
  const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}Z`
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? null : new Date(ms).toISOString()
}

/** Parse UPS `YYYYMMDD` to a date-only `YYYY-MM-DD`; null on missing/invalid. */
function toIsoDate(date: unknown): string | null {
  if (typeof date !== 'string' || !/^\d{8}$/.test(date)) return null
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
}

/** "City, ST, US" — skips empty parts; null when nothing is present. */
function formatLocation(addr: UpsAddress | undefined): string | null {
  if (!addr) return null
  const parts = [addr.city, addr.stateProvince, addr.countryCode ?? addr.country].filter(
    (p): p is string => Boolean(p)
  )
  return parts.length ? parts.join(', ') : null
}

function mapScanEvents(activities: UpsActivity[]): ScanEvent[] {
  return activities
    .map((a) => ({
      date: toUtcIso(a.gmtDate, a.gmtTime),
      location: formatLocation(a.location?.address),
      description: a.status?.description ?? a.status?.simplifiedTextDescription ?? '',
    }))
    .sort((x, y) => (y.date ? Date.parse(y.date) : 0) - (x.date ? Date.parse(x.date) : 0))
    .slice(0, SCAN_EVENT_CAP)
}

interface DeliveryDate {
  date?: string
  type?: string
}

/** Pick the scheduled/estimated delivery date (anything that isn't the actual `DEL`). */
function estimatedDeliveryDate(list: DeliveryDate[]): string | null {
  const scheduled = list.find((d) => d.type && d.type !== 'DEL') ?? list[0]
  return scheduled ? toIsoDate(scheduled.date) : null
}

function deliveredDate(list: DeliveryDate[]): string | null {
  const delivered = list.find((d) => d.type === 'DEL')
  return delivered ? toIsoDate(delivered.date) : null
}

function formatWeight(weight: unknown): string | null {
  const w = weight as { weight?: string; unitOfMeasurement?: string } | undefined
  if (!w?.weight) return null
  const value = String(w.weight).trim()
  if (!value || value === 'string') return null
  return w.unitOfMeasurement && w.unitOfMeasurement !== 'string'
    ? `${value} ${w.unitOfMeasurement}`
    : value
}

/** Drop UPS placeholder/empty strings (its sample payloads literally contain `"string"`). */
function clean(value: unknown): string | null {
  return typeof value === 'string' && value && value !== 'string' ? value : null
}

/**
 * Map a raw UPS package to a normalized shipment. `found: false` when there's
 * no package (not-found or empty response).
 */
export function mapShipment(
  trackingNumber: string,
  pkg: RawPackage | null
): { found: boolean; shipment: MappedShipment | null } {
  if (!pkg) return { found: false, shipment: null }

  const current = (pkg.currentStatus ?? {}) as UpsStatus
  const statusType = (current.type && STATUS_MAP[current.type]) || 'unknown'
  const statusCode = current.code ?? current.statusCode ?? ''

  const activities = Array.isArray(pkg.activity) ? (pkg.activity as UpsActivity[]) : []
  const scanEvents = mapScanEvents(activities)
  const latest = scanEvents[0] ?? null

  const deliveryDates = Array.isArray(pkg.deliveryDate) ? (pkg.deliveryDate as DeliveryDate[]) : []
  const deliveredActivity = activities.find((a) => a.status?.type === 'D')
  const deliveredAt =
    statusType === 'delivered'
      ? (toUtcIso(deliveredActivity?.gmtDate, deliveredActivity?.gmtTime) ??
        latest?.date ??
        deliveredDate(deliveryDates))
      : null

  const deliveryInfo = (pkg.deliveryInformation ?? {}) as {
    pod?: { content?: string }
    signature?: { image?: string }
  }

  const referenceNumbers = (
    Array.isArray(pkg.referenceNumber) ? (pkg.referenceNumber as Array<{ number?: string }>) : []
  )
    .map((r) => r.number)
    .filter((n): n is string => Boolean(n))

  return {
    found: true,
    shipment: {
      trackingNumber,
      statusType,
      statusCode,
      statusDescription: current.description ?? current.simplifiedTextDescription ?? statusCode,
      estimatedDelivery: estimatedDeliveryDate(deliveryDates),
      estimatedDeliveryWindow: null,
      deliveredAt,
      lastActivity: latest
        ? { date: latest.date, location: latest.location, description: latest.description }
        : null,
      service: clean((pkg.service as { description?: string } | undefined)?.description),
      weight: formatWeight(pkg.weight),
      referenceNumbers,
      scanEvents,
      proofOfDelivery: clean(deliveryInfo.pod?.content),
      signature: clean(deliveryInfo.signature?.image),
    },
  }
}
