// src/blocks/shipstation/resources/label/label-execute.server.ts

/**
 * The `label` resource executor: six operations over `/v2/labels`.
 *
 * Every internal `block_shipstation_label_*` tool is a three-line delegate to
 * this function, so the block's flat, operation-prefixed input arrives here
 * unprojected and the mapping to ShipStation's wire shape happens once.
 *
 * ## Three things this file is careful about
 *
 * 1. **Every box's tracking number survives.** A multi-box label carries N
 *    distinct tracking numbers, not a master plus children. `projectLabel` in
 *    `tools/shared/project-label.ts` is the single projector: it orders by
 *    `sequence` and flags the master by EQUALITY against the label's own
 *    tracking number, because the probe's three-box label returned the master
 *    (sequence 1) last. Nothing here re-derives any of that.
 * 2. **`track` is master tracking only.** `GET /v2/labels/{id}/track` answers
 *    for the label's own tracking number. The other boxes are not covered, and
 *    the probe caught it reading `in_transit` on a voided label, so the output
 *    key is `masterTrackingNumber` and never plain `trackingNumber`.
 * 3. **An incomplete address fails here, not at the carrier.** ShipStation
 *    answers a missing `phone` or `state_province` with a 400 whose text does
 *    not name the field. `missingAddressFields` names it instead.
 */

import { InvalidInputError } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../../../tools/shared/connection'
import {
  type ProjectedLabel,
  type ProjectedLabelSummary,
  type RawLabel,
  projectLabel,
  projectLabelSummary,
} from '../../../../tools/shared/project-label'
import { shipstationApi } from '../../../../tools/shared/shipstation-api'
import {
  type AddressStructInput,
  type PackageRowInput,
  type ShipstationAddress,
  missingAddressFields,
  toShipstationAddress,
  toShipstationPackage,
} from '../../shared/to-shipstation-address'

/** A raw label as ShipStation returns it, plus the extras the projector drops. */
interface RawLabelResponse extends RawLabel {
  /**
   * The live API returns the label's state under `status`, and the probe found
   * `label_status` NULL on both list and get responses even though the
   * OpenAPI document only names `status`. Both keys are read; see
   * {@link normalizeLabel}.
   */
  status?: string | null
  label_download?: { href?: string; pdf?: string; png?: string; zpl?: string } | null
  tracking_url?: string | null
  shipment_cost?: { amount?: number; currency?: string } | null
}

/** A page of labels. */
interface RawLabelPage {
  labels?: RawLabelResponse[]
  total?: number
  page?: number
  pages?: number
}

/** `PUT /v2/labels/{id}/void`. */
interface RawVoidResponse {
  approved?: boolean
  message?: string
  reason_code?: string | null
  voided_label_ids?: (string | number)[]
}

/** `GET /v2/labels/{id}/track`. */
interface RawTrackResponse {
  tracking_number?: string
  tracking_url?: string | null
  status_code?: string | null
  status_detail_code?: string | null
  status_description?: string | null
  status_detail_description?: string | null
  carrier_code?: string | null
  carrier_status_code?: string | null
  carrier_status_description?: string | null
  carrier_detail_code?: string | null
  exception_description?: string | null
  ship_date?: string | null
  estimated_delivery_date?: string | null
  actual_delivery_date?: string | null
  events?: RawTrackEvent[]
}

interface RawTrackEvent {
  occurred_at?: string | null
  description?: string | null
  city_locality?: string | null
  state_province?: string | null
  postal_code?: string | null
  country_code?: string | null
  status_code?: string | null
  status_description?: string | null
  carrier_status_code?: string | null
  carrier_status_description?: string | null
  event_code?: string | null
  signer?: string | null
}

/** The extra fields every label-shaped output carries beyond the projection. */
interface LabelExtras {
  labelDownloadUrl: string | null
  trackingUrl: string | null
  shipmentCostAmount: number | null
  shipmentCostCurrency: string | null
}

/**
 * Reconcile the label's status key before projecting.
 *
 * `projectLabel` reads `label_status`. The OpenAPI document calls the field
 * `status`, and the live probe found `label_status` null on real list and get
 * responses, so reading only one of them yields a null status about half the
 * time. Preferring whichever is populated is the whole fix, and it belongs
 * here rather than in the shared projector, which the agent tools also use with
 * their own fixtures.
 */
function normalizeLabel(raw: RawLabelResponse): RawLabel {
  return { ...raw, label_status: raw.label_status ?? raw.status ?? undefined }
}

/** Download url, tracking url and cost, none of which the projector carries. */
function labelExtras(raw: RawLabelResponse): LabelExtras {
  const download = raw.label_download ?? {}
  return {
    labelDownloadUrl: download.href ?? download.pdf ?? download.png ?? download.zpl ?? null,
    trackingUrl: raw.tracking_url ?? null,
    shipmentCostAmount:
      typeof raw.shipment_cost?.amount === 'number' ? raw.shipment_cost.amount : null,
    shipmentCostCurrency: raw.shipment_cost?.currency ?? null,
  }
}

/** A label in full: every box, ordered by sequence, master flagged by equality. */
function toDetail(raw: RawLabelResponse): ProjectedLabel & LabelExtras {
  return { ...projectLabel(normalizeLabel(raw)), ...labelExtras(raw) }
}

/** A label for a list row: every tracking number, no per-box weights. */
function toSummary(raw: RawLabelResponse): ProjectedLabelSummary & LabelExtras {
  return { ...projectLabelSummary(normalizeLabel(raw)), ...labelExtras(raw) }
}

/** Path segments come from author input, so they are always escaped. */
function segment(value: unknown, field: string): string {
  const text = String(value ?? '').trim()
  if (!text) throw new InvalidInputError(`${field} is required.`)
  return encodeURIComponent(text)
}

/** An address that ShipStation would reject fails here, naming what is missing. */
function requireAddress(address: unknown, phone: unknown, which: string): ShipstationAddress {
  const mapped = toShipstationAddress(
    address as AddressStructInput | undefined,
    phone === undefined || phone === null ? undefined : String(phone)
  )
  const missing = missingAddressFields(mapped)
  if (missing.length > 0) {
    throw new InvalidInputError(`${which} is missing ${missing.join(', ')}.`)
  }
  return mapped
}

/** The label-rendering options every purchase endpoint accepts. */
function labelOptions(format: unknown, layout: unknown): Record<string, unknown> {
  return {
    label_format: (format as string) || 'pdf',
    label_layout: (layout as string) || '4x6',
    // `url` keeps the response small and gives the workflow a link to pass on.
    // `inline` would inline base64 label bytes into every downstream variable.
    label_download_type: 'url',
  }
}

/**
 * The `POST /v2/labels` body for `from: scratch`.
 *
 * ShipStation needs either `ship_from` or `warehouse_id`, never neither, which
 * is why `labelCreateShipFromMode` exists rather than an optional address.
 */
function buildScratchBody(input: Record<string, any>): Record<string, unknown> {
  const rows = (input.labelCreatePackages ?? []) as PackageRowInput[]
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new InvalidInputError('At least one package is required to buy a label from scratch.')
  }

  const shipment: Record<string, unknown> = {
    service_code: String(input.labelCreateServiceCode ?? '').trim(),
    ship_to: requireAddress(input.labelCreateShipTo, input.labelCreateShipToPhone, 'Ship to'),
    packages: rows.map(toShipstationPackage),
  }
  if (!shipment.service_code) throw new InvalidInputError('Service code is required.')

  if (input.labelCreateCarrierId) shipment.carrier_id = String(input.labelCreateCarrierId)
  if (input.labelCreateShipDate) shipment.ship_date = String(input.labelCreateShipDate)
  if (input.labelCreateExternalShipmentId) {
    shipment.external_shipment_id = String(input.labelCreateExternalShipmentId)
  }
  if (input.labelCreateConfirmation) shipment.confirmation = String(input.labelCreateConfirmation)
  if (input.labelCreateInsuranceProvider) {
    shipment.insurance_provider = String(input.labelCreateInsuranceProvider)
  }

  if ((input.labelCreateShipFromMode ?? 'warehouse') === 'warehouse') {
    const warehouseId = String(input.labelCreateWarehouseId ?? '').trim()
    if (!warehouseId) throw new InvalidInputError('A ship-from warehouse is required.')
    shipment.warehouse_id = warehouseId
  } else {
    shipment.ship_from = requireAddress(
      input.labelCreateShipFrom,
      input.labelCreateShipFromPhone,
      'Ship from'
    )
  }

  return {
    shipment,
    validate_address: (input.labelCreateValidateAddress as string) || 'no_validation',
    test_label: input.labelCreateTestLabel === true,
    ...labelOptions(input.labelCreateLabelFormat, input.labelCreateLabelLayout),
  }
}

/**
 * Run one `label` operation.
 *
 * @param operation One of `getMany`, `get`, `create`, `void`, `createReturn`, `track`.
 * @param input The block's flat, `label`-prefixed input, forwarded unchanged.
 */
export async function executeLabel(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const apiKey = getShipstationApiKey()

  switch (operation) {
    case 'getMany': {
      const page = Number(input.labelGetManyPage) > 0 ? Number(input.labelGetManyPage) : 1
      const pageSize =
        Number(input.labelGetManyPageSize) > 0 ? Number(input.labelGetManyPageSize) : 25

      const data = await shipstationApi<RawLabelPage>('/labels', apiKey, {
        label_status: input.labelGetManyStatus,
        carrier_id: input.labelGetManyCarrierId,
        service_code: input.labelGetManyServiceCode,
        tracking_number: input.labelGetManyTrackingNumber,
        batch_id: input.labelGetManyBatchId,
        shipment_id: input.labelGetManyShipmentId,
        external_shipment_id: input.labelGetManyExternalShipmentId,
        warehouse_id: input.labelGetManyWarehouseId,
        created_at_start: input.labelGetManyCreatedAtStart,
        created_at_end: input.labelGetManyCreatedAtEnd,
        sort_by: input.labelGetManySortBy || 'created_at',
        sort_dir: input.labelGetManySortDir || 'desc',
        page,
        page_size: pageSize,
      })

      const labels = (data.labels ?? []).map(toSummary)
      return {
        labels,
        total: typeof data.total === 'number' ? data.total : null,
        page,
        pageSize,
        // Prefer the provider's own page count; a full page means "maybe more".
        hasMore: typeof data.pages === 'number' ? page < data.pages : labels.length === pageSize,
      }
    }

    case 'get': {
      const id = segment(input.labelGetId, 'Id')
      const endpoint =
        input.labelGetIdKind === 'externalShipmentId'
          ? `/labels/external_shipment_id/${id}`
          : `/labels/${id}`
      const raw = await shipstationApi<RawLabelResponse>(endpoint, apiKey)
      return { label: toDetail(raw) }
    }

    case 'create': {
      const from = (input.labelCreateFrom as string) || 'shipment'

      if (from === 'shipment') {
        const shipmentId = segment(input.labelCreateShipmentId, 'Shipment id')
        const raw = await shipstationApi<RawLabelResponse>({
          endpoint: `/labels/shipment/${shipmentId}`,
          apiKey,
          method: 'POST',
          body: labelOptions(input.labelCreateLabelFormat, input.labelCreateLabelLayout),
        })
        return { label: toDetail(raw) }
      }

      if (from === 'rate') {
        const rateId = segment(input.labelCreateRateId, 'Rate id')
        const raw = await shipstationApi<RawLabelResponse>({
          endpoint: `/labels/rates/${rateId}`,
          apiKey,
          method: 'POST',
          body: labelOptions(input.labelCreateLabelFormat, input.labelCreateLabelLayout),
        })
        return { label: toDetail(raw) }
      }

      if (from === 'scratch') {
        const raw = await shipstationApi<RawLabelResponse>({
          endpoint: '/labels',
          apiKey,
          method: 'POST',
          body: buildScratchBody(input),
        })
        return { label: toDetail(raw) }
      }

      throw new InvalidInputError(`Unknown label purchase mode: ${from}`)
    }

    case 'void': {
      const labelId = segment(input.labelVoidId, 'Label id')
      const raw = await shipstationApi<RawVoidResponse>({
        endpoint: `/labels/${labelId}/void`,
        apiKey,
        method: 'PUT',
      })
      return {
        // A 200 is "the request reached the carrier", not "the money came
        // back". `approved` is the answer, and it is routinely false.
        approved: raw?.approved === true,
        message: raw?.message ?? '',
        reasonCode: raw?.reason_code ?? '',
        voidedLabelIds: (raw?.voided_label_ids ?? []).map((id) => String(id)),
      }
    }

    case 'createReturn': {
      const labelId = segment(input.labelCreateReturnId, 'Outbound label id')
      const raw = await shipstationApi<RawLabelResponse>({
        endpoint: `/labels/${labelId}/return`,
        apiKey,
        method: 'POST',
        body: labelOptions(input.labelCreateReturnLabelFormat, input.labelCreateReturnLabelLayout),
      })
      return { label: toDetail(raw) }
    }

    case 'track': {
      const labelId = segment(input.labelTrackId, 'Label id')
      const raw = await shipstationApi<RawTrackResponse>(`/labels/${labelId}/track`, apiKey)
      return {
        masterTrackingNumber: raw?.tracking_number ?? '',
        statusCode: raw?.status_code ?? '',
        statusDescription: raw?.status_description ?? '',
        statusDetailCode: raw?.status_detail_code ?? '',
        statusDetailDescription: raw?.status_detail_description ?? '',
        carrierCode: raw?.carrier_code ?? '',
        carrierStatusCode: raw?.carrier_status_code ?? '',
        carrierStatusDescription: raw?.carrier_status_description ?? '',
        carrierDetailCode: raw?.carrier_detail_code ?? '',
        exceptionDescription: raw?.exception_description ?? '',
        shipDate: raw?.ship_date ?? '',
        estimatedDeliveryDate: raw?.estimated_delivery_date ?? '',
        actualDeliveryDate: raw?.actual_delivery_date ?? '',
        trackingUrl: raw?.tracking_url ?? '',
        events: (raw?.events ?? []).map((event) => ({
          occurredAt: event.occurred_at ?? '',
          description: event.description ?? '',
          cityLocality: event.city_locality ?? '',
          stateProvince: event.state_province ?? '',
          postalCode: event.postal_code ?? '',
          countryCode: event.country_code ?? '',
          statusCode: event.status_code ?? '',
          statusDescription: event.status_description ?? '',
          carrierStatusCode: event.carrier_status_code ?? '',
          carrierStatusDescription: event.carrier_status_description ?? '',
          eventCode: event.event_code ?? '',
          signer: event.signer ?? '',
        })),
      }
    }

    default:
      throw new InvalidInputError(`Unknown label operation: ${operation}`)
  }
}
