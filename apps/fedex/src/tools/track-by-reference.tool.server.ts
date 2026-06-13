// src/tools/track-by-reference.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { trackByReference } from './shared/fedex-api'
import { mapShipment } from './shared/map-shipment'
import { getFedexCredentials } from './shared/connection'
import type { TrackResults } from './shared/shipment-schema'

interface TrackByReferenceInput {
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

/** YYYY-MM-DD for a Date (FedEx reference lookups want date-only ship windows). */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default async function trackByReferenceTool(
  input: TrackByReferenceInput
): Promise<TrackResults> {
  const referenceType = input.referenceType ?? 'CUSTOMER_REFERENCE'
  // The JSON Schema converter strips zod refinements — guard the enum here too.
  if (!REFERENCE_TYPES.includes(referenceType)) {
    throw new InvalidInputError(`Unknown referenceType "${referenceType}".`)
  }

  const { accountNumber } = getFedexCredentials()
  if (!accountNumber) {
    throw new InvalidInputError(
      'Reference lookups require a FedEx account number. Add it to the FedEx connection in Settings → Apps → FedEx.'
    )
  }

  // FedEx wants a ship-date window for reference lookups — default the last 30 days.
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

  const results = numberResults.map(({ trackingNumber, trackResults }) => {
    const { found, shipment } = mapShipment(trackingNumber, trackResults)
    return { trackingNumber, found, shipment }
  })

  return { results }
}
