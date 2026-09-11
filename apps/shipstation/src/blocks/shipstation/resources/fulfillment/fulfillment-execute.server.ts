// src/blocks/shipstation/resources/fulfillment/fulfillment-execute.server.ts

/**
 * Executor for the `fulfillment` resource.
 *
 * `GET /v2/fulfillments` treats every filter as optional and ANDs whatever it
 * is given, so an unset input must be absent from the query rather than sent
 * blank. `buildFulfillmentQuery` is where that happens, and it is exported so
 * the tests can assert it directly instead of reading a stubbed `fetch`.
 */

import { getShipstationApiKey } from '../../../../tools/shared/connection'
import { type ShipStationQuery, shipstationApi } from '../../../../tools/shared/shipstation-api'

interface RawFulfillmentAddress {
  name?: string | null
  city_locality?: string | null
  state_province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

interface RawFulfillment {
  fulfillment_id?: string
  shipment_id?: string
  shipment_number?: string
  tracking_number?: string
  created_at?: string
  ship_date?: string
  voided_at?: string | null
  delivered_at?: string | null
  fulfillment_carrier_friendly_name?: string
  fulfillment_provider_code?: string | null
  fulfillment_service_code?: string | null
  fulfillment_fee?: { currency?: string; amount?: number } | null
  void_requested?: boolean
  voided?: boolean
  order_source_notified?: boolean
  ship_to?: RawFulfillmentAddress | null
}

interface FulfillmentListResponse {
  fulfillments?: RawFulfillment[]
  page?: number
  pages?: number
  total?: number
}

/**
 * Block input key to ShipStation query parameter.
 *
 * Every one of these is a plain string pass-through; the numeric and enum
 * inputs are handled separately below because they need coercion or a
 * "leave it to ShipStation" empty value.
 */
const STRING_FILTERS: [string, string][] = [
  ['fulfillmentGetManyTrackingNumber', 'tracking_number'],
  ['fulfillmentGetManyShipmentId', 'shipment_id'],
  ['fulfillmentGetManyFulfillmentId', 'fulfillment_id'],
  ['fulfillmentGetManyShipmentNumber', 'shipment_number'],
  ['fulfillmentGetManyBatchId', 'batch_id'],
  ['fulfillmentGetManyOrderSourceId', 'order_source_id'],
  ['fulfillmentGetManyShipToName', 'ship_to_name'],
  ['fulfillmentGetManyShipDateStart', 'ship_date_start'],
  ['fulfillmentGetManyShipDateEnd', 'ship_date_end'],
  ['fulfillmentGetManyCreateDateStart', 'create_date_start'],
  ['fulfillmentGetManyCreateDateEnd', 'create_date_end'],
]

/** Execute one `fulfillment` operation. */
export async function executeFulfillment(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  if (operation !== 'getMany') throw new Error(`Unknown fulfillment operation: ${operation}`)

  const apiKey = getShipstationApiKey()
  const result = await shipstationApi<FulfillmentListResponse>(
    '/fulfillments',
    apiKey,
    buildFulfillmentQuery(input)
  )

  const fulfillments = (result.fulfillments ?? []).map(projectFulfillment)
  return {
    fulfillments,
    count: fulfillments.length,
    total: result.total ?? fulfillments.length,
    page: result.page ?? 1,
    pages: result.pages ?? 1,
  }
}

/**
 * The query for `GET /v2/fulfillments`, carrying only the filters the author
 * actually set.
 *
 * An unset filter is omitted, never sent empty: ShipStation ANDs its filters, so
 * `tracking_number=` would be a filter for the empty tracking number rather than
 * no filter at all.
 */
export function buildFulfillmentQuery(input: any): ShipStationQuery {
  const query: ShipStationQuery = {}

  for (const [key, parameter] of STRING_FILTERS) {
    const value = String(input?.[key] ?? '').trim()
    if (value) query[parameter] = value
  }

  const page = toPositiveInteger(input?.fulfillmentGetManyPage)
  if (page !== undefined) query.page = page

  const pageSize = toPositiveInteger(input?.fulfillmentGetManyPageSize)
  if (pageSize !== undefined) query.page_size = pageSize

  const sortBy = String(input?.fulfillmentGetManySortBy ?? '').trim()
  if (sortBy) query.sort_by = sortBy

  const sortDir = String(input?.fulfillmentGetManySortDir ?? '').trim()
  if (sortDir) query.sort_dir = sortDir

  return query
}

/** `undefined` for anything that is not a usable page number, so the query drops it. */
function toPositiveInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return Math.trunc(parsed)
}

/**
 * Project one fulfillment row.
 *
 * `ship_to` is flattened to the few parts a workflow branches on. The full
 * address is not reconstructed here: a fulfillment's `ship_to` has no
 * residential indicator, so passing it off as a shipping address would produce
 * one that quietly lacks the field that drives a carrier surcharge.
 */
function projectFulfillment(fulfillment: RawFulfillment) {
  const shipTo = fulfillment.ship_to ?? {}
  const fee = fulfillment.fulfillment_fee ?? {}

  return {
    fulfillmentId: fulfillment.fulfillment_id ?? '',
    shipmentId: fulfillment.shipment_id ?? '',
    shipmentNumber: fulfillment.shipment_number ?? '',
    trackingNumber: fulfillment.tracking_number ?? '',
    carrierFriendlyName: fulfillment.fulfillment_carrier_friendly_name ?? '',
    fulfillmentProviderCode: fulfillment.fulfillment_provider_code ?? '',
    fulfillmentServiceCode: fulfillment.fulfillment_service_code ?? '',
    createdAt: fulfillment.created_at ?? '',
    shipDate: fulfillment.ship_date ?? '',
    deliveredAt: fulfillment.delivered_at ?? '',
    voidedAt: fulfillment.voided_at ?? '',
    voided: Boolean(fulfillment.voided),
    voidRequested: Boolean(fulfillment.void_requested),
    orderSourceNotified: Boolean(fulfillment.order_source_notified),
    feeAmount: typeof fee.amount === 'number' ? fee.amount : 0,
    feeCurrency: fee.currency ?? '',
    shipToName: shipTo.name ?? '',
    shipToCity: shipTo.city_locality ?? '',
    shipToState: shipTo.state_province ?? '',
    shipToPostalCode: shipTo.postal_code ?? '',
    shipToCountry: shipTo.country_code ?? '',
  }
}
