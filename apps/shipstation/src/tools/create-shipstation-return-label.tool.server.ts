// src/tools/create-shipstation-return-label.tool.server.ts

/**
 * `POST /v2/labels/{label_id}/return`: create a return label for an existing
 * outbound label.
 *
 * The single agent-facing WRITE in this app, which is why it sits in its own
 * toolset: granting an agent the reads and granting it the ability to buy a
 * return label from a carrier are two different admin decisions.
 *
 * Nothing here retries. The shared client surfaces a 429 as `RateLimitError`
 * and a retry of a label purchase is not idempotent, so the caller decides.
 */

import { getShipstationApiKey } from './shared/connection'
import { type RawLabel, projectLabel } from './shared/project-label'
import { shipstationApi } from './shared/shipstation-api'

/**
 * The return response is a full `label` body. Two fields the shared `RawLabel`
 * does not model are read here:
 *
 * - `status` is where V2 actually reports the label's lifecycle. The shared
 *   projector reads `label_status`, which is why `labelStatus` has been
 *   observed null on live responses, so it is filled in from `status` below.
 * - `label_download` carries the printable artifact.
 */
interface RawReturnLabel extends RawLabel {
  status?: string
  rma_number?: string | null
  label_download?: { href?: string; pdf?: string; png?: string; zpl?: string } | null
  shipment_cost?: { currency?: string; amount?: number } | null
}

interface CreateReturnLabelInput {
  labelId: string
  labelFormat?: 'pdf' | 'png' | 'zpl'
  labelLayout?: '4x6' | 'letter'
}

export default async function createShipstationReturnLabel(input: CreateReturnLabelInput) {
  const apiKey = getShipstationApiKey()

  // Only the keys the caller set are sent; the carrier's own defaults apply to
  // the rest. `label_download_type` is deliberately never sent: the default
  // returns URLs, and the `inline` alternative would put a base64 label image
  // into the answer.
  const body: Record<string, string> = {}
  if (input.labelFormat) body.label_format = input.labelFormat
  if (input.labelLayout) body.label_layout = input.labelLayout

  const raw = await shipstationApi<RawReturnLabel>({
    endpoint: `/labels/${encodeURIComponent(input.labelId)}/return`,
    apiKey,
    method: 'POST',
    body,
  })

  const projected = projectLabel(raw)
  const label = { ...projected, labelStatus: projected.labelStatus ?? raw.status ?? null }
  const download = raw.label_download ?? null
  const downloadUrl = download?.href ?? download?.pdf ?? download?.png ?? download?.zpl ?? null
  const cost =
    raw.shipment_cost && typeof raw.shipment_cost.amount === 'number'
      ? { currency: raw.shipment_cost.currency ?? '', amount: raw.shipment_cost.amount }
      : null

  const summary =
    `Return label ${label.labelId} created against outbound label ${input.labelId}` +
    (label.carrierCode ? ` with ${label.carrierCode}` : '') +
    `. Tracking ${label.masterTrackingNumber ?? 'not yet assigned'}` +
    (cost ? `, cost ${cost.amount} ${cost.currency}` : '') +
    '. ' +
    (downloadUrl
      ? 'The printable label is at downloadUrl.'
      : 'No printable label URL was returned yet; the label may still be processing.')

  return {
    summary,
    label,
    downloadUrl,
    pdfUrl: download?.pdf ?? null,
    pngUrl: download?.png ?? null,
    zplUrl: download?.zpl ?? null,
    rmaNumber: raw.rma_number ?? null,
    shipmentCost: cost,
  }
}
