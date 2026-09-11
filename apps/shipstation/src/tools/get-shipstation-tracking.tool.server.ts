// src/tools/get-shipstation-tracking.tool.server.ts

/**
 * Live carrier tracking for one parcel: `GET /v2/tracking`.
 *
 * This is the only honest answer to "where is this box". The probe
 * (`plans/apps/shipstation/api-probe-2026-09-10.md` §3) found a label whose own
 * `tracking_status` read `in_transit` while the carrier reported
 * `NY / Not Yet In System`, and voided labels reporting `in_transit` too. A
 * label's status is a label-level field that is not refreshed per box, so it is
 * never a substitute for this call.
 */

import { InvalidInputError } from '@auxx/sdk/server'
import { getShipstationApiKey } from './shared/connection'
import { shipstationApi } from './shared/shipstation-api'

/**
 * ShipStation's high-level status codes, spelled out. The provider also sends a
 * `status_description`; this map exists so a missing description still yields a
 * word rather than a two-letter code the model has to guess at.
 */
const STATUS_LABELS: Record<string, string> = {
  UN: 'unknown',
  AC: 'accepted',
  IT: 'in_transit',
  DE: 'delivered',
  EX: 'exception',
  AT: 'delivery_attempted',
  NY: 'not_yet_in_system',
  SP: 'delivered_to_collection_location',
}

/**
 * Event budget. Carrier scan histories are normally well under this; the cap
 * stops a pathological one from swamping the model, and `eventsTruncated` says
 * so rather than silently dropping scans.
 */
const MAX_EVENTS = 40

interface RawTrackEvent {
  occurred_at?: string
  carrier_occurred_at?: string
  description?: string
  city_locality?: string
  state_province?: string
  postal_code?: string
  country_code?: string
  company_name?: string
  signer?: string
  event_code?: string
  status_code?: string
  status_detail_code?: string
  status_description?: string
  status_detail_description?: string
  carrier_status_code?: string
  carrier_status_description?: string
}

interface RawTracking {
  tracking_number?: string
  tracking_url?: string | null
  status_code?: string
  status_detail_code?: string | null
  status_description?: string
  status_detail_description?: string | null
  carrier_code?: string
  carrier_id?: number | string
  carrier_status_code?: string
  carrier_detail_code?: string
  carrier_status_description?: string
  ship_date?: string | null
  estimated_delivery_date?: string | null
  actual_delivery_date?: string | null
  exception_description?: string | null
  events?: RawTrackEvent[]
}

export interface ProjectedTrackEvent {
  occurredAt: string | null
  carrierOccurredAt: string | null
  status: string | null
  statusCode: string | null
  description: string | null
  detailDescription: string | null
  carrierStatusCode: string | null
  carrierStatusDescription: string | null
  cityLocality: string | null
  stateProvince: string | null
  postalCode: string | null
  countryCode: string | null
  signer: string | null
}

interface GetShipstationTrackingInput {
  trackingNumber: string
  carrierCode?: string
  carrierId?: string
}

function label(statusCode: string | undefined): string | null {
  if (!statusCode) return null
  return STATUS_LABELS[statusCode] ?? statusCode
}

function projectEvent(event: RawTrackEvent): ProjectedTrackEvent {
  return {
    occurredAt: event.occurred_at ?? null,
    carrierOccurredAt: event.carrier_occurred_at ?? null,
    status: label(event.status_code),
    statusCode: event.status_code ?? null,
    description: event.status_description ?? event.description ?? null,
    detailDescription: event.status_detail_description ?? null,
    carrierStatusCode: event.carrier_status_code ?? null,
    carrierStatusDescription: event.carrier_status_description ?? null,
    cityLocality: event.city_locality ?? null,
    stateProvince: event.state_province ?? null,
    postalCode: event.postal_code ?? null,
    countryCode: event.country_code ?? null,
    signer: event.signer ?? null,
  }
}

/** Newest scan first. Rows without a timestamp sort last, stably. */
function byNewest(a: ProjectedTrackEvent, b: ProjectedTrackEvent): number {
  if (a.occurredAt === b.occurredAt) return 0
  if (a.occurredAt === null) return 1
  if (b.occurredAt === null) return -1
  return a.occurredAt < b.occurredAt ? 1 : -1
}

/**
 * A rollup the model can quote. Written so the answer leads with the carrier's
 * own words rather than a status enum.
 */
function summarize(
  trackingNumber: string,
  status: string | null,
  statusDescription: string | null,
  latest: ProjectedTrackEvent | undefined,
  estimatedDeliveryDate: string | null,
  actualDeliveryDate: string | null,
  exceptionDescription: string | null
): string {
  const parts = [`${trackingNumber}: ${statusDescription ?? status ?? 'no status reported'}.`]
  if (actualDeliveryDate) parts.push(`Delivered ${actualDeliveryDate}.`)
  else if (estimatedDeliveryDate) parts.push(`Estimated delivery ${estimatedDeliveryDate}.`)
  if (exceptionDescription) parts.push(`Exception: ${exceptionDescription}.`)
  if (latest) {
    const place = [latest.cityLocality, latest.stateProvince, latest.countryCode]
      .filter(Boolean)
      .join(', ')
    parts.push(
      `Last scan ${latest.occurredAt ?? 'at an unreported time'}` +
        (place ? ` in ${place}` : '') +
        (latest.description ? `: ${latest.description}` : '') +
        '.'
    )
  } else {
    parts.push('The carrier has reported no scans yet.')
  }
  return parts.join(' ')
}

/**
 * Look up one tracking number with the carrier. Requires a carrier code or a
 * carrier id alongside it: ShipStation will not resolve a bare number, and
 * guessing a carrier would quietly return someone else's parcel or nothing.
 */
export default async function getShipstationTracking(input: GetShipstationTrackingInput) {
  if (!input.carrierCode && !input.carrierId) {
    throw new InvalidInputError(
      'Provide carrierCode or carrierId as well as trackingNumber. Use list_shipstation_carriers ' +
        'to find them, or read carrierCode off the label.'
    )
  }

  const apiKey = getShipstationApiKey()
  const raw = await shipstationApi<RawTracking>('/tracking', apiKey, {
    tracking_number: input.trackingNumber,
    carrier_code: input.carrierCode,
    carrier_id: input.carrierId,
  })

  const allEvents = (raw.events ?? []).map(projectEvent).sort(byNewest)
  const events = allEvents.slice(0, MAX_EVENTS)
  const statusCode = raw.status_code ?? null
  const status = label(raw.status_code)
  const statusDescription = raw.status_description ?? null
  const trackingNumber = raw.tracking_number ?? input.trackingNumber
  const estimatedDeliveryDate = raw.estimated_delivery_date ?? null
  const actualDeliveryDate = raw.actual_delivery_date ?? null
  const exceptionDescription = raw.exception_description ?? null

  return {
    summary: summarize(
      trackingNumber,
      status,
      statusDescription,
      events[0],
      estimatedDeliveryDate,
      actualDeliveryDate,
      exceptionDescription
    ),
    trackingNumber,
    carrierCode: raw.carrier_code ?? input.carrierCode ?? null,
    trackingUrl: raw.tracking_url ?? null,
    status,
    statusCode,
    statusDescription,
    statusDetailCode: raw.status_detail_code ?? null,
    statusDetailDescription: raw.status_detail_description ?? null,
    carrierStatusCode: raw.carrier_status_code ?? null,
    carrierStatusDescription: raw.carrier_status_description ?? null,
    delivered: statusCode === 'DE',
    inTransit: statusCode === 'IT' || statusCode === 'AC',
    exception: statusCode === 'EX',
    shipDate: raw.ship_date ?? null,
    estimatedDeliveryDate,
    actualDeliveryDate,
    exceptionDescription,
    events,
    eventCount: allEvents.length,
    eventsTruncated: allEvents.length > events.length,
  }
}
