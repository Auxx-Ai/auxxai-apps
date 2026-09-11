// src/tools/get-shipstation-shipment-packages.tool.server.ts

import { getShipstationApiKey } from './shared/connection'
import { type ProjectedLabel, type RawLabel, projectLabel } from './shared/project-label'
import { shipstationApi } from './shared/shipstation-api'

/**
 * Bounded paging. A shipment's label history is normally one or two rows; the
 * budget exists so a pathological relabel loop cannot hang the tool. Running
 * out returns `complete: false` rather than silently truncating.
 */
const PAGE_SIZE = 50
const MAX_PAGES = 5

interface GetShipmentPackagesInput {
  shipmentId: string
}

interface RawShipment {
  shipment_id?: string
  shipment_number?: string | number
  store_id?: string
  shipment_status?: string
  external_shipment_id?: string | null
}

interface RawLabelPage {
  labels?: RawLabel[]
  pages?: number
}

export default async function getShipstationShipmentPackages(input: GetShipmentPackagesInput) {
  const apiKey = getShipstationApiKey()
  const { shipmentId } = input

  const shipment = await shipstationApi<RawShipment>(
    `/shipments/${encodeURIComponent(shipmentId)}`,
    apiKey
  )

  const labels: ProjectedLabel[] = []
  let complete = true
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await shipstationApi<RawLabelPage>('/labels', apiKey, {
      shipment_id: shipmentId,
      page,
      page_size: PAGE_SIZE,
      sort_by: 'created_at',
      sort_dir: 'asc',
    })

    const batch = data.labels ?? []
    labels.push(...batch.map(projectLabel))

    const morePages =
      typeof data.pages === 'number' ? page < data.pages : batch.length === PAGE_SIZE
    if (!morePages) break
    if (page === MAX_PAGES) complete = false
  }

  const activeLabels = labels.filter((l) => !l.voided)
  const voidedLabels = labels.filter((l) => l.voided)

  // Every box number across the active labels. Packages are already ordered by
  // sequence inside each label, so this preserves label order then box order.
  const activeTrackingNumbers = activeLabels.flatMap((l) =>
    l.packages.map((p) => p.trackingNumber).filter((n): n is string => Boolean(n))
  )

  return {
    shipmentId: shipment.shipment_id ?? shipmentId,
    shipmentNumber:
      shipment.shipment_number === undefined || shipment.shipment_number === null
        ? null
        : String(shipment.shipment_number),
    storeId: shipment.store_id ?? null,
    shipmentStatus: shipment.shipment_status ?? null,
    externalShipmentId: shipment.external_shipment_id ?? null,
    activeLabels,
    voidedLabels,
    activeTrackingNumbers,
    complete,
  }
}
