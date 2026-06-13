// src/tools/fedex-block-track-by-reference.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { trackByReference } from './shared/fedex-api'
import { mapShipment } from './shared/map-shipment'
import { getFedexCredentials } from './shared/connection'
import { flattenShipment, type FlatShipment } from './shared/block-io'
import type { MappedShipment } from './shared/shipment-schema'

interface Input {
  reference: string
  referenceType?: string
  shipDateBegin?: string
  shipDateEnd?: string
}

const REFERENCE_TYPES = [
  'CUSTOMER_REFERENCE',
  'PURCHASE_ORDER',
  'INVOICE',
  'BILL_OF_LADING',
  'PART_NUMBER',
]

/** YYYY-MM-DD (FedEx reference lookups want date-only ship windows). */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Most recent of several matches, by last-activity date. */
function pickMostRecent(found: MappedShipment[]): MappedShipment {
  return found
    .slice()
    .sort(
      (a, b) =>
        (b.lastActivity?.date ? Date.parse(b.lastActivity.date) : 0) -
        (a.lastActivity?.date ? Date.parse(a.lastActivity.date) : 0)
    )[0]
}

/**
 * Backs the FedEx block `shipment.trackByReference` op. A reference can match
 * several shipments — returns the most-recent match flattened, with `matchCount`
 * so a workflow can branch when it's ambiguous.
 */
export default async function fedexBlockTrackByReference(input: Input): Promise<FlatShipment> {
  const referenceType = input.referenceType ?? 'CUSTOMER_REFERENCE'
  if (!REFERENCE_TYPES.includes(referenceType)) {
    throw new InvalidInputError(`Unknown referenceType "${referenceType}".`)
  }

  const { accountNumber } = getFedexCredentials()
  if (!accountNumber) {
    throw new InvalidInputError(
      'Reference lookups require a FedEx account number. Add it to the FedEx connection in Settings → Apps → FedEx.'
    )
  }

  const now = new Date()
  const shipDateEnd = input.shipDateEnd ?? isoDate(now)
  const shipDateBegin = input.shipDateBegin ?? isoDate(new Date(now.getTime() - 30 * 86400 * 1000))

  const numberResults = await trackByReference({
    reference: input.reference,
    referenceType,
    accountNumber,
    shipDateBegin,
    shipDateEnd,
  })

  const shipments = numberResults
    .map(({ trackingNumber, trackResults }) => mapShipment(trackingNumber, trackResults).shipment)
    .filter((s): s is MappedShipment => s != null)

  if (!shipments.length) {
    return flattenShipment(input.reference, false, null, 0)
  }

  const best = pickMostRecent(shipments)
  return flattenShipment(best.trackingNumber, true, best, shipments.length)
}
