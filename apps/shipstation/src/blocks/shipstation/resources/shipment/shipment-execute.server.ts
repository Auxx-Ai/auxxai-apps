// src/blocks/shipstation/resources/shipment/shipment-execute.server.ts

/**
 * The `shipment` resource's eight operations against ShipStation V2.
 *
 * One entry point, `executeShipment`, called by the eight
 * `block_shipstation_shipment_*` internal tools. It receives the block's flat,
 * prefixed input unchanged, so every read is `input.shipment<Operation><Field>`.
 *
 * ## Two invariants this file exists to hold
 *
 * 1. **`update` is a read-modify-write.** ShipStation's update is
 *    `PUT /v2/shipments/{id}` over the WHOLE shipment, not a PATCH. Sending
 *    only the author's changed fields would blank out the recipient address,
 *    the packages and the carrier on every run. So the current shipment is
 *    fetched, the author's changes are merged onto it, and the merged document
 *    is what goes back.
 *
 * 2. **An address is checked before the call, not by the call.** ShipStation
 *    answers a partial address with a 400 whose body names nothing a workflow
 *    author can act on. `missingAddressFields` names the missing parts instead.
 */

import { InvalidInputError } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../../../tools/shared/connection'
import { shipstationApi } from '../../../../tools/shared/shipstation-api'
import {
  missingAddressFields,
  type PackageRowInput,
  type ShipstationAddress,
  toShipstationAddress,
  toShipstationPackage,
} from '../../shared/to-shipstation-address'

/** `GET /v2/shipments`. */
interface ListShipmentsResponse {
  shipments?: RawShipment[]
  total?: number
  page?: number
  pages?: number
}

/** `POST /v2/shipments`. Answers 200 with `has_errors`, not a 4xx, on a rejected row. */
interface CreateShipmentsResponse {
  has_errors?: boolean
  shipments?: (RawShipment & { errors?: string[] })[]
}

/** `POST /v2/shipments/{id}/tags/{tag_name}`. */
interface TagShipmentResponse {
  tags?: (string | { name?: string })[]
}

/** `POST /v2/shipments/{id}/internal_notes`. */
interface InternalNotesResponse {
  internal_notes?: string
}

/** As much of ShipStation's `shipment` as this block reads. */
interface RawShipment {
  shipment_id?: string
  external_shipment_id?: string
  external_order_id?: string
  shipment_number?: string
  shipment_status?: string
  carrier_id?: string
  service_code?: string
  warehouse_id?: string
  store_id?: string
  ship_date?: string
  created_at?: string
  modified_at?: string
  internal_notes?: string
  is_return?: boolean
  total_weight?: { value?: number; unit?: string }
  tags?: (string | { name?: string })[]
  packages?: unknown[]
  ship_to?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Fields ShipStation marks `readOnly` on `shipment`. They come back on a GET
 * and must be dropped before the merged document is PUT back, or the write is
 * rejected for trying to set a server-owned value.
 */
const READ_ONLY_SHIPMENT_FIELDS = [
  'shipment_id',
  'created_at',
  'modified_at',
  'shipment_status',
  'total_weight',
  'batch_ids',
  'errors',
  'address_validation',
] as const

/** Run one shipment operation. `input` is the block's flat, prefixed input. */
export async function executeShipment(operation: string, input: any): Promise<Record<string, any>> {
  const apiKey = getShipstationApiKey()

  switch (operation) {
    case 'getMany': {
      const result = await shipstationApi<ListShipmentsResponse>('/shipments', apiKey, {
        shipment_status: emptyToUndefined(input.shipmentGetManyStatus),
        modified_at_start: emptyToUndefined(input.shipmentGetManyModifiedAtStart),
        modified_at_end: emptyToUndefined(input.shipmentGetManyModifiedAtEnd),
        created_at_start: emptyToUndefined(input.shipmentGetManyCreatedAtStart),
        created_at_end: emptyToUndefined(input.shipmentGetManyCreatedAtEnd),
        store_id: emptyToUndefined(input.shipmentGetManyStoreId),
        sales_order_id: emptyToUndefined(input.shipmentGetManySalesOrderId),
        batch_id: emptyToUndefined(input.shipmentGetManyBatchId),
        tag: emptyToUndefined(input.shipmentGetManyTag),
        shipment_number: emptyToUndefined(input.shipmentGetManyShipmentNumber),
        ship_to_name: emptyToUndefined(input.shipmentGetManyShipToName),
        item_keyword: emptyToUndefined(input.shipmentGetManyItemKeyword),
        page: toPositiveInteger(input.shipmentGetManyPage),
        page_size: toPositiveInteger(input.shipmentGetManyPageSize),
        sort_by: emptyToUndefined(input.shipmentGetManySortBy),
        sort_dir: emptyToUndefined(input.shipmentGetManySortDir),
      })

      const shipments = (result.shipments ?? []).map(mapShipment)
      return {
        shipments,
        count: shipments.length,
        total: result.total ?? shipments.length,
        page: result.page ?? 1,
        pages: result.pages ?? 1,
      }
    }

    case 'get': {
      const id = requireId(input.shipmentGetId, 'shipment id')
      // The two lookups are different endpoints, not a query parameter, so the
      // id kind picks the path rather than a filter.
      const endpoint =
        input.shipmentGetIdKind === 'externalShipmentId'
          ? `/shipments/external_shipment_id/${encodeURIComponent(id)}`
          : `/shipments/${encodeURIComponent(id)}`

      const result = await shipstationApi<RawShipment>(endpoint, apiKey)
      return { shipment: mapShipment(result) }
    }

    case 'create': {
      const body = buildCreateBody(input)
      const result = await shipstationApi<CreateShipmentsResponse>({
        endpoint: '/shipments',
        apiKey,
        method: 'POST',
        body: { shipments: [body] },
      })

      const created = result.shipments?.[0]
      // A rejected shipment comes back inside a 200 with `has_errors`, so the
      // HTTP status alone would report success on a shipment that was never
      // created.
      if (result.has_errors) {
        const detail = created?.errors?.join('; ')
        throw new InvalidInputError(detail || 'ShipStation rejected the shipment.')
      }

      return { shipment: mapShipment(created) }
    }

    case 'update': {
      const id = requireId(input.shipmentUpdateShipmentId, 'shipment id')
      const current = await shipstationApi<RawShipment>(
        `/shipments/${encodeURIComponent(id)}`,
        apiKey
      )

      const result = await shipstationApi<RawShipment>({
        endpoint: `/shipments/${encodeURIComponent(id)}`,
        apiKey,
        method: 'PUT',
        body: buildUpdateBody(input, current),
      })

      // ShipStation answers the PUT with the updated shipment, but an empty
      // body has been seen on some accounts; fall back to a fresh read rather
      // than returning a shipment of blanks.
      const updated =
        result && Object.keys(result).length > 0
          ? result
          : await shipstationApi<RawShipment>(`/shipments/${encodeURIComponent(id)}`, apiKey)

      return { shipment: mapShipment(updated) }
    }

    case 'cancel': {
      const id = requireId(input.shipmentCancelShipmentId, 'shipment id')
      await shipstationApi<void>({
        endpoint: `/shipments/${encodeURIComponent(id)}/cancel`,
        apiKey,
        method: 'PUT',
      })
      return { shipmentId: id, cancelled: true }
    }

    case 'addTag': {
      const id = requireId(input.shipmentAddTagShipmentId, 'shipment id')
      const tagName = requireId(input.shipmentAddTagName, 'tag')
      const result = await shipstationApi<TagShipmentResponse>({
        // The tag is a PATH segment, so a tag with a space or a slash in it has
        // to be encoded or it silently tags something else (or 404s).
        endpoint: `/shipments/${encodeURIComponent(id)}/tags/${encodeURIComponent(tagName)}`,
        apiKey,
        method: 'POST',
      })
      return { shipmentId: id, tagName, tags: normalizeTags(result?.tags) }
    }

    case 'removeTag': {
      const id = requireId(input.shipmentRemoveTagShipmentId, 'shipment id')
      const tagName = requireId(input.shipmentRemoveTagName, 'tag')
      await shipstationApi<void>({
        endpoint: `/shipments/${encodeURIComponent(id)}/tags/${encodeURIComponent(tagName)}`,
        apiKey,
        method: 'DELETE',
      })
      // The delete answers with no body, so there is no post-state to report.
      return { shipmentId: id, tagName, tags: [] }
    }

    case 'addNote': {
      const id = requireId(input.shipmentAddNoteShipmentId, 'shipment id')
      const note = String(input.shipmentAddNoteNote ?? '')
      // `mode` is required by the endpoint, not optional with a server default.
      const mode = input.shipmentAddNoteMode === 'overwrite' ? 'overwrite' : 'append'
      if (mode === 'append' && !note.trim()) {
        throw new InvalidInputError('A note is required when appending.')
      }

      const result = await shipstationApi<InternalNotesResponse>({
        endpoint: `/shipments/${encodeURIComponent(id)}/internal_notes`,
        apiKey,
        method: 'POST',
        body: { note, mode },
      })
      return { shipmentId: id, internalNotes: result?.internal_notes ?? note }
    }

    default:
      throw new Error(`Unknown shipment operation: ${operation}`)
  }
}

/** The `create_shipment_request` body for one shipment. */
function buildCreateBody(input: any): Record<string, any> {
  const shipTo = toShipstationAddress(input.shipmentCreateShipTo, input.shipmentCreateShipToPhone)
  assertAddressComplete(shipTo, 'Ship to')

  const body: Record<string, any> = {
    ship_to: shipTo,
    ...originFor(input.shipmentCreateShipFromMode, {
      warehouseId: input.shipmentCreateWarehouseId,
      address: input.shipmentCreateShipFrom,
      phone: input.shipmentCreateShipFromPhone,
    }),
  }

  assertCarrierServicePair(input.shipmentCreateCarrierId, input.shipmentCreateServiceCode)
  assign(body, 'carrier_id', input.shipmentCreateCarrierId)
  assign(body, 'service_code', input.shipmentCreateServiceCode)
  assign(body, 'external_shipment_id', input.shipmentCreateExternalShipmentId)
  assign(body, 'store_id', input.shipmentCreateStoreId)
  assign(body, 'ship_date', input.shipmentCreateShipDate)
  assign(body, 'internal_notes', input.shipmentCreateInternalNotes)
  assign(body, 'validate_address', input.shipmentCreateValidateAddress)

  const packages = mapPackages(input.shipmentCreatePackages)
  if (packages.length > 0) body.packages = packages

  return body
}

/**
 * The merged `update_shipment_request_body`.
 *
 * Starts from what ShipStation currently holds because the endpoint is a PUT
 * over the whole shipment. Only the fields the author filled in are overwritten.
 */
function buildUpdateBody(input: any, current: RawShipment): Record<string, any> {
  const body: Record<string, any> = { ...current }
  for (const field of READ_ONLY_SHIPMENT_FIELDS) delete body[field]

  if (hasAddress(input.shipmentUpdateShipTo)) {
    const shipTo = toShipstationAddress(input.shipmentUpdateShipTo, input.shipmentUpdateShipToPhone)
    assertAddressComplete(shipTo, 'Ship to')
    body.ship_to = shipTo
  }

  const mode = input.shipmentUpdateShipFromMode
  if (mode === 'warehouse' || mode === 'address') {
    const origin = originFor(mode, {
      warehouseId: input.shipmentUpdateWarehouseId,
      address: input.shipmentUpdateShipFrom,
      phone: input.shipmentUpdateShipFromPhone,
    })
    // The two origins are mutually exclusive on ShipStation's side, so the one
    // that is not being set has to be cleared rather than left behind.
    body.ship_from = origin.ship_from ?? null
    body.warehouse_id = origin.warehouse_id ?? null
  }

  assertCarrierServicePair(input.shipmentUpdateCarrierId, input.shipmentUpdateServiceCode)
  assign(body, 'carrier_id', input.shipmentUpdateCarrierId)
  assign(body, 'service_code', input.shipmentUpdateServiceCode)
  assign(body, 'external_shipment_id', input.shipmentUpdateExternalShipmentId)
  assign(body, 'shipment_number', input.shipmentUpdateShipmentNumber)
  assign(body, 'store_id', input.shipmentUpdateStoreId)
  assign(body, 'ship_date', input.shipmentUpdateShipDate)
  assign(body, 'internal_notes', input.shipmentUpdateInternalNotes)

  const packages = mapPackages(input.shipmentUpdatePackages)
  if (packages.length > 0) body.packages = packages

  return body
}

/**
 * The origin half of a shipment body: `warehouse_id` OR `ship_from`, never both.
 *
 * ShipStation's own note on `shipment` is "Either `ship_from` or `warehouse_id`
 * must be set", which is why this is a mode select rather than two optional
 * fields an author could fill in together.
 */
function originFor(
  mode: string | undefined,
  source: { warehouseId?: string; address?: unknown; phone?: string }
): { warehouse_id?: string; ship_from?: ShipstationAddress } {
  if (mode === 'address') {
    const shipFrom = toShipstationAddress(source.address as any, source.phone)
    assertAddressComplete(shipFrom, 'Ship from')
    return { ship_from: shipFrom }
  }

  const warehouseId = String(source.warehouseId ?? '').trim()
  if (!warehouseId) {
    throw new InvalidInputError(
      'Choose the warehouse this shipment ships from, or switch "Ship from" to an address.'
    )
  }
  return { warehouse_id: warehouseId }
}

/**
 * Refuse a carrier without a service level, the way buying a label will.
 *
 * ShipStation validates this pair asymmetrically: `POST /v2/shipments` accepts a
 * `carrier_id` with no `service_code` and returns 201, then
 * `POST /v2/labels/shipment/{id}` rejects that same shipment with
 * `service_code is required when carrier_id is provided`. So without this the
 * error always lands on the NEXT node, against a shipment that already exists —
 * and `shipment.update` is a full-document PUT, so repairing it in place means
 * a read-modify-write rather than filling in one field.
 *
 * Raised here instead, naming the field the author has to fill.
 */
function assertCarrierServicePair(carrierId: unknown, serviceCode: unknown): void {
  const hasCarrier = typeof carrierId === 'string' && carrierId.trim() !== ''
  const hasService = typeof serviceCode === 'string' && serviceCode.trim() !== ''
  if (hasCarrier && !hasService) {
    throw new InvalidInputError(
      'Service code is required when a carrier is selected. Pick the service level ' +
        'beside the carrier, or clear the carrier to let the label step choose.'
    )
  }
}

/** Fail with the missing parts named, rather than letting ShipStation answer an opaque 400. */
function assertAddressComplete(address: ShipstationAddress, label: string): void {
  const missing = missingAddressFields(address)
  if (missing.length > 0) {
    throw new InvalidInputError(`${label} is missing: ${missing.join(', ')}.`)
  }
}

/** Was an address field filled in at all? An untouched one is `undefined` or all blanks. */
function hasAddress(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  return Object.values(value as Record<string, unknown>).some(
    (entry) => typeof entry === 'string' && entry.trim() !== ''
  )
}

function mapPackages(rows: unknown): Record<string, any>[] {
  if (!Array.isArray(rows)) return []
  return rows
    .filter((row): row is PackageRowInput => !!row && typeof row === 'object')
    .map(toShipstationPackage)
}

/** Set a key only when the author actually supplied a value. */
function assign(body: Record<string, any>, key: string, value: unknown): void {
  if (value === undefined || value === null) return
  if (typeof value === 'string' && value.trim() === '') return
  body[key] = typeof value === 'string' ? value.trim() : value
}

/** Normalize `tags`, which is `[{ name }]` on a shipment and `[string]` on a tag write. */
function normalizeTags(tags: (string | { name?: string })[] | undefined): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => (typeof tag === 'string' ? tag : (tag?.name ?? '')))
    .filter((name) => name !== '')
}

function requireId(value: unknown, label: string): string {
  const id = String(value ?? '').trim()
  if (!id) throw new InvalidInputError(`A ${label} is required.`)
  return id
}

function emptyToUndefined(value: unknown): string | undefined {
  const text = String(value ?? '').trim()
  return text === '' ? undefined : text
}

function toPositiveInteger(value: unknown): number | undefined {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return Math.floor(parsed)
}

/** Project ShipStation's shipment onto the block's flat output struct. */
function mapShipment(shipment: RawShipment | undefined): Record<string, any> {
  const s = shipment ?? {}
  const shipTo = (s.ship_to ?? {}) as Record<string, string | undefined>

  return {
    shipmentId: String(s.shipment_id ?? ''),
    externalShipmentId: s.external_shipment_id ?? '',
    externalOrderId: s.external_order_id ?? '',
    shipmentNumber: s.shipment_number ?? '',
    shipmentStatus: s.shipment_status ?? '',
    carrierId: s.carrier_id ?? '',
    serviceCode: s.service_code ?? '',
    warehouseId: s.warehouse_id ?? '',
    storeId: s.store_id ?? '',
    shipDate: s.ship_date ?? '',
    createdAt: s.created_at ?? '',
    modifiedAt: s.modified_at ?? '',
    internalNotes: s.internal_notes ?? '',
    isReturn: s.is_return ?? false,
    totalWeightValue: Number(s.total_weight?.value ?? 0),
    totalWeightUnit: s.total_weight?.unit ?? '',
    packageCount: Array.isArray(s.packages) ? s.packages.length : 0,
    tags: normalizeTags(s.tags),
    shipToName: shipTo.name ?? '',
    shipToPhone: shipTo.phone ?? '',
    shipToLine1: shipTo.address_line1 ?? '',
    shipToLine2: shipTo.address_line2 ?? '',
    shipToCity: shipTo.city_locality ?? '',
    shipToState: shipTo.state_province ?? '',
    shipToPostalCode: shipTo.postal_code ?? '',
    shipToCountry: shipTo.country_code ?? '',
  }
}
