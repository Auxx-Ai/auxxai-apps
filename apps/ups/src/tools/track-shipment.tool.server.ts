// src/tools/track-shipment.tool.server.ts

import { mapShipment } from './shared/map-shipment'
import { trackNumbers } from './shared/ups-api'
import type { TrackResults } from './shared/shipment-schema'

interface TrackShipmentInput {
  trackingNumbers: string[]
  includeProofOfDelivery?: boolean
  includeSignature?: boolean
}

export default async function trackShipment(input: TrackShipmentInput): Promise<TrackResults> {
  const { trackingNumbers, includeProofOfDelivery, includeSignature } = input

  const trackResults = await trackNumbers(trackingNumbers, {
    returnPod: includeProofOfDelivery,
    returnSignature: includeSignature,
  })

  const results = trackResults.map((r) => {
    const { found, shipment } = mapShipment(r.trackingNumber, r.pkg)
    return { trackingNumber: r.trackingNumber, found, shipment }
  })

  return { results }
}
