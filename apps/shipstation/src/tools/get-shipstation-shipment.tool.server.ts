// src/tools/get-shipstation-shipment.tool.server.ts

/**
 * One shipment in full: `GET /v2/shipments/{shipment_id}` or
 * `GET /v2/shipments/external_shipment_id/{external_shipment_id}`.
 *
 * Both endpoints return the same `shipment` body, so the id kind selects a path
 * and nothing else. They are one tool because the caller usually has whichever
 * id the record it is holding carries, and a two-tool split just makes the
 * model choose between names instead of passing an argument.
 *
 * This module also owns the shipment projection, which
 * `list-shipstation-shipments.tool.server.ts` imports. It is the shipment-side
 * counterpart to `shared/project-label.ts`, which projects labels only.
 */

import { getShipstationApiKey } from './shared/connection'
import { shipstationApi } from './shared/shipstation-api'

interface RawWeight {
  value?: number
  unit?: string
}

interface RawDimensions {
  length?: number
  width?: number
  height?: number
  unit?: string
}

interface RawAddress {
  name?: string | null
  company_name?: string | null
  address_line1?: string | null
  address_line2?: string | null
  address_line3?: string | null
  city_locality?: string | null
  state_province?: string | null
  postal_code?: string | null
  country_code?: string | null
  address_residential_indicator?: string | null
}

interface RawShipmentPackage {
  shipment_package_id?: string
  package_id?: string
  package_code?: string
  package_name?: string
  weight?: RawWeight
  dimensions?: RawDimensions
  external_package_id?: string | null
  content_description?: string | null
}

interface RawShipmentItem {
  name?: string | null
  sku?: string | null
  quantity?: number
  unit_price?: number | null
  sales_order_id?: string | null
  sales_order_item_id?: string | null
  external_order_id?: string | null
  external_order_item_id?: string | null
}

/** A shipment as ShipStation V2 reports it, narrowed to the fields tools read. */
export interface RawShipment {
  shipment_id?: string
  external_shipment_id?: string | null
  external_order_id?: string | null
  shipment_number?: string | number | null
  store_id?: string | null
  shipment_status?: string | null
  carrier_id?: string | null
  service_code?: string | null
  warehouse_id?: string | null
  is_return?: boolean | null
  confirmation?: string | null
  order_source_code?: string | null
  ship_date?: string | null
  created_at?: string | null
  modified_at?: string | null
  tags?: ({ name?: string } | string)[]
  batch_ids?: string[]
  ship_to?: RawAddress | null
  total_weight?: RawWeight | null
  packages?: RawShipmentPackage[]
  items?: RawShipmentItem[]
}

export interface ProjectedShipmentSummary {
  shipmentId: string
  shipmentNumber: string | null
  externalShipmentId: string | null
  externalOrderId: string | null
  storeId: string | null
  shipmentStatus: string | null
  carrierId: string | null
  serviceCode: string | null
  warehouseId: string | null
  isReturn: boolean
  shipDate: string | null
  createdAt: string | null
  modifiedAt: string | null
  shipToName: string | null
  shipToPlace: string | null
  packageCount: number
  itemCount: number
  totalWeight: { value: number; unit: string } | null
  tags: string[]
}

export interface ProjectedShipment extends ProjectedShipmentSummary {
  confirmation: string | null
  orderSourceCode: string | null
  batchIds: string[]
  shipTo: {
    name: string | null
    companyName: string | null
    addressLine1: string | null
    addressLine2: string | null
    addressLine3: string | null
    cityLocality: string | null
    stateProvince: string | null
    postalCode: string | null
    countryCode: string | null
    residential: boolean | null
  } | null
  packages: {
    shipmentPackageId: string | null
    packageCode: string | null
    packageName: string | null
    externalPackageId: string | null
    contentDescription: string | null
    weight: { value: number; unit: string } | null
    dimensions: { length: number; width: number; height: number; unit: string } | null
  }[]
  items: {
    name: string | null
    sku: string | null
    quantity: number | null
    unitPrice: number | null
    salesOrderId: string | null
    externalOrderId: string | null
  }[]
}

function projectWeight(weight: RawWeight | null | undefined) {
  if (!weight || typeof weight.value !== 'number') return null
  return { value: weight.value, unit: weight.unit ?? '' }
}

function projectDimensions(dimensions: RawDimensions | undefined) {
  if (
    !dimensions ||
    typeof dimensions.length !== 'number' ||
    typeof dimensions.width !== 'number' ||
    typeof dimensions.height !== 'number'
  ) {
    return null
  }
  return {
    length: dimensions.length,
    width: dimensions.width,
    height: dimensions.height,
    unit: dimensions.unit ?? '',
  }
}

/** A one-line "city, state country" for list rows, so a row is placeable at a glance. */
function projectPlace(address: RawAddress | null | undefined): string | null {
  if (!address) return null
  const place = [address.city_locality, address.state_province, address.country_code]
    .filter((part): part is string => Boolean(part))
    .join(', ')
  return place === '' ? null : place
}

function projectTags(tags: RawShipment['tags']): string[] {
  return (tags ?? [])
    .map((tag) => (typeof tag === 'string' ? tag : (tag?.name ?? '')))
    .filter((name) => name !== '')
}

/**
 * List-shaped projection: enough to identify, place and triage a shipment,
 * without the addresses, boxes and line items that belong to the detail tool.
 */
export function projectShipmentSummary(shipment: RawShipment): ProjectedShipmentSummary {
  return {
    shipmentId: shipment.shipment_id ?? '',
    shipmentNumber:
      shipment.shipment_number === undefined || shipment.shipment_number === null
        ? null
        : String(shipment.shipment_number),
    externalShipmentId: shipment.external_shipment_id ?? null,
    externalOrderId: shipment.external_order_id ?? null,
    storeId: shipment.store_id ?? null,
    shipmentStatus: shipment.shipment_status ?? null,
    carrierId: shipment.carrier_id ?? null,
    serviceCode: shipment.service_code ?? null,
    warehouseId: shipment.warehouse_id ?? null,
    isReturn: Boolean(shipment.is_return),
    shipDate: shipment.ship_date ?? null,
    createdAt: shipment.created_at ?? null,
    modifiedAt: shipment.modified_at ?? null,
    shipToName: shipment.ship_to?.name ?? null,
    shipToPlace: projectPlace(shipment.ship_to),
    packageCount: (shipment.packages ?? []).length,
    itemCount: (shipment.items ?? []).length,
    totalWeight: projectWeight(shipment.total_weight),
    tags: projectTags(shipment.tags),
  }
}

/**
 * Detail projection. The recipient's email and phone are deliberately NOT
 * carried: a support agent already has the customer's contact details from the
 * thread, and copying them into every shipment answer spreads personal data for
 * no gain.
 */
export function projectShipment(shipment: RawShipment): ProjectedShipment {
  const shipTo = shipment.ship_to
  const residential = shipTo?.address_residential_indicator

  return {
    ...projectShipmentSummary(shipment),
    confirmation: shipment.confirmation ?? null,
    orderSourceCode: shipment.order_source_code ?? null,
    batchIds: shipment.batch_ids ?? [],
    shipTo: shipTo
      ? {
          name: shipTo.name ?? null,
          companyName: shipTo.company_name ?? null,
          addressLine1: shipTo.address_line1 ?? null,
          addressLine2: shipTo.address_line2 ?? null,
          addressLine3: shipTo.address_line3 ?? null,
          cityLocality: shipTo.city_locality ?? null,
          stateProvince: shipTo.state_province ?? null,
          postalCode: shipTo.postal_code ?? null,
          countryCode: shipTo.country_code ?? null,
          // 'unknown' is a real third value upstream and must not collapse to false.
          residential: residential === 'yes' ? true : residential === 'no' ? false : null,
        }
      : null,
    packages: (shipment.packages ?? []).map((pkg) => ({
      shipmentPackageId: pkg.shipment_package_id ?? null,
      packageCode: pkg.package_code ?? null,
      packageName: pkg.package_name ?? null,
      externalPackageId: pkg.external_package_id ?? null,
      contentDescription: pkg.content_description ?? null,
      weight: projectWeight(pkg.weight),
      dimensions: projectDimensions(pkg.dimensions),
    })),
    items: (shipment.items ?? []).map((item) => ({
      name: item.name ?? null,
      sku: item.sku ?? null,
      quantity: typeof item.quantity === 'number' ? item.quantity : null,
      unitPrice: typeof item.unit_price === 'number' ? item.unit_price : null,
      salesOrderId: item.sales_order_id ?? null,
      externalOrderId: item.external_order_id ?? null,
    })),
  }
}

interface GetShipstationShipmentInput {
  shipmentId: string
  idKind?: 'shipstation' | 'external'
}

/**
 * Fetch one shipment by either its ShipStation id or the order source's own
 * external shipment id.
 */
export default async function getShipstationShipment(input: GetShipstationShipmentInput) {
  const apiKey = getShipstationApiKey()
  const id = encodeURIComponent(input.shipmentId)
  const endpoint =
    input.idKind === 'external' ? `/shipments/external_shipment_id/${id}` : `/shipments/${id}`

  const raw = await shipstationApi<RawShipment>(endpoint, apiKey)

  return { shipment: projectShipment(raw) }
}
