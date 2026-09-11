// src/tools/list-shipstation-shipments.tool.server.ts

/**
 * `GET /v2/shipments`, newest first.
 *
 * Sort is fixed to `created_at desc` for the same reason the label list fixes
 * it: a model that can reorder a list will, and "the latest shipment" then
 * silently means something different between two calls. The date filters are
 * the supported way to ask for a window.
 */

import { getShipstationApiKey } from './shared/connection'
import { shipstationApi } from './shared/shipstation-api'
import {
  type ProjectedShipmentSummary,
  type RawShipment,
  projectShipmentSummary,
} from './get-shipstation-shipment.tool.server'

interface ListShipstationShipmentsInput {
  shipmentStatus?: 'pending' | 'processing' | 'label_purchased' | 'cancelled'
  storeId?: string
  salesOrderId?: string
  shipmentNumber?: string
  shipToName?: string
  createdAtStart?: string
  createdAtEnd?: string
  modifiedAtStart?: string
  modifiedAtEnd?: string
  page?: number
  pageSize?: number
}

interface RawShipmentPage {
  shipments?: RawShipment[]
  total?: number
  page?: number
  pages?: number
}

/**
 * A rollup the model can quote instead of re-deriving it from the rows, and the
 * place completeness is stated in words: a truncated list reasoned over as if
 * it were the whole set is the failure mode this sentence exists to prevent.
 */
function summarize(
  shipments: ProjectedShipmentSummary[],
  total: number | null,
  hasMore: boolean
): string {
  if (shipments.length === 0) return 'No shipments matched this filter.'

  const statuses = [...new Set(shipments.map((s) => s.shipmentStatus).filter(Boolean))].join(', ')
  const boxes = shipments.reduce((n, s) => n + s.packageCount, 0)
  const returns = shipments.filter((s) => s.isReturn).length

  return (
    `${shipments.length} shipment${shipments.length === 1 ? '' : 's'} on this page` +
    (total === null ? '' : ` of ${total} matching`) +
    `, covering ${boxes} planned box${boxes === 1 ? '' : 'es'}. ` +
    (returns > 0 ? `${returns} return. ` : '') +
    (statuses ? `Statuses: ${statuses}. ` : '') +
    (hasMore
      ? 'More pages match this filter, so this is NOT the full set.'
      : 'This is the last page, so this is the full set.')
  )
}

export default async function listShipstationShipments(input: ListShipstationShipmentsInput) {
  const apiKey = getShipstationApiKey()
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 20

  const data = await shipstationApi<RawShipmentPage>('/shipments', apiKey, {
    shipment_status: input.shipmentStatus,
    store_id: input.storeId,
    sales_order_id: input.salesOrderId,
    shipment_number: input.shipmentNumber,
    ship_to_name: input.shipToName,
    created_at_start: input.createdAtStart,
    created_at_end: input.createdAtEnd,
    modified_at_start: input.modifiedAtStart,
    modified_at_end: input.modifiedAtEnd,
    page,
    page_size: pageSize,
    sort_by: 'created_at',
    sort_dir: 'desc',
  })

  const shipments = (data.shipments ?? []).map(projectShipmentSummary)
  const total = typeof data.total === 'number' ? data.total : null
  // Prefer the provider's own page count; fall back to a full page meaning "maybe more".
  const hasMore = typeof data.pages === 'number' ? page < data.pages : shipments.length === pageSize

  return {
    summary: summarize(shipments, total, hasMore),
    shipments,
    total,
    page,
    pageSize,
    pages: typeof data.pages === 'number' ? data.pages : null,
    hasMore,
  }
}
