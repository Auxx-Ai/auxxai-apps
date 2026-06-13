// src/tools/track-shipment.tool.server.ts

import { trackByNumbers } from './shared/fedex-api'
import { mapShipment } from './shared/map-shipment'
import type { TrackResults } from './shared/shipment-schema'

interface TrackShipmentInput {
  trackingNumbers: string[]
  shipDateBegin?: string
  shipDateEnd?: string
}

export default async function trackShipment(input: TrackShipmentInput): Promise<TrackResults> {
  const { trackingNumbers, shipDateBegin, shipDateEnd } = input

  const infos = trackingNumbers.map((trackingNumber) => ({
    trackingNumberInfo: { trackingNumber },
    ...(shipDateBegin ? { shipDateBegin } : {}),
    ...(shipDateEnd ? { shipDateEnd } : {}),
  }))

  const numberResults = await trackByNumbers(infos)

  // Index FedEx results by number so we can answer for every requested number,
  // even one FedEx omits from the response.
  const byNumber = new Map(numberResults.map((r) => [r.trackingNumber, r.trackResults]))

  const results = trackingNumbers.map((trackingNumber) => {
    const trackResults = byNumber.get(trackingNumber) ?? []
    const { found, shipment } = mapShipment(trackingNumber, trackResults)
    return { trackingNumber, found, shipment }
  })

  return { results }
}
