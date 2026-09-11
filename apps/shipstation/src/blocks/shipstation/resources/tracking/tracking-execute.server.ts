// src/blocks/shipstation/resources/tracking/tracking-execute.server.ts

/**
 * Executor for the `tracking` resource.
 *
 * One call, `GET /v2/tracking`. The response is a single parcel's state plus
 * its scan history; it is NOT a list, so there is no paging here.
 *
 * The query builder and the projection are exported separately from the
 * executor so both are testable without a connection or a stubbed transport.
 */

import { InvalidInputError } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../../../tools/shared/connection'
import { type ShipStationQuery, shipstationApi } from '../../../../tools/shared/shipstation-api'

/**
 * ShipStation's high-level tracking status codes, spelled out.
 *
 * Taken verbatim from the `status_code` enum's own description table in the V2
 * OpenAPI document. The code is the stable thing to branch on; this is what a
 * workflow renders into an email when `status_description` comes back empty.
 */
export const TRACKING_STATUS_LABELS: Record<string, string> = {
  UN: 'Unknown',
  AC: 'Accepted',
  IT: 'In Transit',
  DE: 'Delivered',
  EX: 'Exception',
  AT: 'Delivery Attempt',
  NY: 'Not Yet In System',
  SP: 'Delivered To Collection Location',
}

/**
 * Statuses a parcel does not leave.
 *
 * `DE` (delivered) and `SP` (delivered to a collection point) are both ends of
 * the line. A polling trigger uses this to stop spending calls on parcels that
 * have arrived. `EX` is deliberately NOT terminal: an exception is frequently
 * followed by a redelivery.
 */
const TERMINAL_STATUS_CODES: ReadonlySet<string> = new Set(['DE', 'SP'])

/** The subset of `GET /v2/tracking`'s response this block projects. */
interface TrackingResponse {
  tracking_number?: string
  tracking_url?: string
  status_code?: string
  status_description?: string
  status_detail_code?: string
  status_detail_description?: string
  carrier_code?: string
  carrier_id?: number | string
  carrier_status_code?: string
  carrier_status_description?: string
  carrier_detail_code?: string
  exception_description?: string
  ship_date?: string
  estimated_delivery_date?: string
  actual_delivery_date?: string
  events?: TrackingEventResponse[]
}

interface TrackingEventResponse {
  occurred_at?: string
  carrier_occurred_at?: string
  description?: string
  status_code?: string
  status_description?: string
  status_detail_code?: string
  status_detail_description?: string
  carrier_status_code?: string
  carrier_status_description?: string
  carrier_detail_code?: string
  event_code?: string
  city_locality?: string
  state_province?: string
  postal_code?: string
  country_code?: string
  company_name?: string
  signer?: string
  latitude?: number
  longitude?: number
  proof_of_delivery_url?: string
}

/**
 * Build the `GET /v2/tracking` query from the block's flat input.
 *
 * ShipStation accepts the carrier either as `carrier_code` (a string such as
 * `usps`) or as `carrier_id` (a connected account, `se-1234567`). The author
 * picks which with `trackingGetCarrierBy`, but whichever side is actually
 * filled in wins: a workflow built in "code" mode and later rebound to a
 * carrier id should keep working rather than fail with an empty parameter.
 *
 * @throws InvalidInputError when the tracking number or the carrier is missing.
 */
export function buildTrackingQuery(input: Record<string, any>): ShipStationQuery {
  const trackingNumber = String(input.trackingGetTrackingNumber ?? '').trim()
  if (!trackingNumber) {
    throw new InvalidInputError('A tracking number is required to look up tracking.')
  }

  const carrierCode = String(input.trackingGetCarrierCode ?? '').trim()
  const carrierId = String(input.trackingGetCarrierId ?? '').trim()
  const preferId = input.trackingGetCarrierBy === 'id'

  const query: ShipStationQuery = { tracking_number: trackingNumber }

  if (preferId && carrierId) query.carrier_id = carrierId
  else if (!preferId && carrierCode) query.carrier_code = carrierCode
  else if (carrierId) query.carrier_id = carrierId
  else if (carrierCode) query.carrier_code = carrierCode
  else {
    throw new InvalidInputError(
      'A carrier is required to look up tracking. Give either a carrier code or a connected carrier.'
    )
  }

  return query
}

/** Project one carrier scan. */
function projectEvent(event: TrackingEventResponse) {
  const statusCode = event.status_code ?? ''
  return {
    occurredAt: event.occurred_at ?? '',
    carrierOccurredAt: event.carrier_occurred_at ?? '',
    description: event.description ?? '',
    statusCode,
    statusLabel: TRACKING_STATUS_LABELS[statusCode] ?? '',
    statusDescription: event.status_description ?? '',
    statusDetailCode: event.status_detail_code ?? '',
    statusDetailDescription: event.status_detail_description ?? '',
    carrierStatusCode: event.carrier_status_code ?? '',
    carrierStatusDescription: event.carrier_status_description ?? '',
    carrierDetailCode: event.carrier_detail_code ?? '',
    eventCode: event.event_code ?? '',
    cityLocality: event.city_locality ?? '',
    stateProvince: event.state_province ?? '',
    postalCode: event.postal_code ?? '',
    countryCode: event.country_code ?? '',
    companyName: event.company_name ?? '',
    signer: event.signer ?? '',
    latitude: typeof event.latitude === 'number' ? event.latitude : 0,
    longitude: typeof event.longitude === 'number' ? event.longitude : 0,
    proofOfDeliveryUrl: event.proof_of_delivery_url ?? '',
  }
}

/**
 * Project `GET /v2/tracking` onto the block's output variables.
 *
 * `delivered` is derived from the status CODE, not from the presence of
 * `actual_delivery_date`: a carrier can report a delivery date on a parcel that
 * was later returned, and the code is what ShipStation itself branches on.
 *
 * Events are returned oldest-first, which is the order a timeline renders in
 * and the order the carrier reports. Nothing here re-sorts them: a scan with a
 * missing timestamp would otherwise be silently moved.
 */
export function projectTracking(response: TrackingResponse | undefined) {
  const body = response ?? {}
  const statusCode = body.status_code ?? ''
  const delivered = statusCode === 'DE'
  const events = (body.events ?? []).map(projectEvent)

  return {
    tracking: {
      trackingNumber: body.tracking_number ?? '',
      trackingUrl: body.tracking_url ?? '',
      statusCode,
      statusLabel: TRACKING_STATUS_LABELS[statusCode] ?? '',
      statusDescription: body.status_description ?? '',
      statusDetailCode: body.status_detail_code ?? '',
      statusDetailDescription: body.status_detail_description ?? '',
      carrierCode: body.carrier_code ?? '',
      carrierId: body.carrier_id === undefined ? '' : String(body.carrier_id),
      carrierStatusCode: body.carrier_status_code ?? '',
      carrierStatusDescription: body.carrier_status_description ?? '',
      carrierDetailCode: body.carrier_detail_code ?? '',
      exceptionDescription: body.exception_description ?? '',
      shipDate: body.ship_date ?? '',
      estimatedDeliveryDate: body.estimated_delivery_date ?? '',
      actualDeliveryDate: body.actual_delivery_date ?? '',
      delivered,
      exception: statusCode === 'EX',
      terminal: TERMINAL_STATUS_CODES.has(statusCode),
    },
    events,
    eventCount: events.length,
    delivered,
  }
}

/** Run one `tracking` operation. */
export async function executeTracking(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  if (operation !== 'get') {
    throw new Error(`Unknown tracking operation: ${operation}`)
  }

  const query = buildTrackingQuery(input)
  const apiKey = getShipstationApiKey()
  const response = await shipstationApi<TrackingResponse>('/tracking', apiKey, query)

  return projectTracking(response)
}
