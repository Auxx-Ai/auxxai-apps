// src/tools/list-shipstation-labels.tool.server.ts

import { getShipstationApiKey } from './shared/connection'
import {
  type ProjectedLabelSummary,
  type RawLabel,
  projectLabelSummary,
} from './shared/project-label'
import { shipstationApi } from './shared/shipstation-api'

interface ListShipstationLabelsInput {
  shipmentId?: string
  trackingNumber?: string
  carrierId?: string
  labelStatus?: string
  page?: number
  pageSize?: number
}

interface RawLabelPage {
  labels?: RawLabel[]
  total?: number
  page?: number
  pages?: number
}

/**
 * A rollup the model can quote instead of re-deriving it from the rows. Without
 * this a list response tends to get collapsed into "here are your shipments"
 * with the tracking numbers dropped.
 */
function summarize(
  labels: ProjectedLabelSummary[],
  total: number | null,
  hasMore: boolean
): string {
  if (labels.length === 0) return 'No labels matched this filter.'

  const multiBox = labels.filter((l) => l.packageCount > 1).length
  const voided = labels.filter((l) => l.voided).length
  const carriers = [...new Set(labels.map((l) => l.carrierCode).filter(Boolean))].join(', ')
  const boxes = labels.reduce((n, l) => n + l.packageCount, 0)

  return (
    `${labels.length} label${labels.length === 1 ? '' : 's'} on this page` +
    (total === null ? '' : ` of ${total} matching`) +
    `, covering ${boxes} package${boxes === 1 ? '' : 's'}. ` +
    `${multiBox} multi-box, ${voided} voided. ` +
    (carriers ? `Carriers: ${carriers}. ` : '') +
    (hasMore ? 'More pages available.' : 'This is the last page.')
  )
}

export default async function listShipstationLabels(input: ListShipstationLabelsInput) {
  const apiKey = getShipstationApiKey()
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 20

  const data = await shipstationApi<RawLabelPage>('/labels', apiKey, {
    shipment_id: input.shipmentId,
    tracking_number: input.trackingNumber,
    carrier_id: input.carrierId,
    label_status: input.labelStatus,
    page,
    page_size: pageSize,
    sort_by: 'created_at',
    sort_dir: 'desc',
  })

  const labels = (data.labels ?? []).map(projectLabelSummary)
  const total = typeof data.total === 'number' ? data.total : null
  // Prefer the provider's own page count; fall back to a full page meaning "maybe more".
  const hasMore = typeof data.pages === 'number' ? page < data.pages : labels.length === pageSize

  return { summary: summarize(labels, total, hasMore), labels, total, page, pageSize, hasMore }
}
