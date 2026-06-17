// src/tools/ups-block-track.tool.server.ts

import { mapShipment } from './shared/map-shipment'
import { trackNumbers } from './shared/ups-api'
import { flattenShipment, type FlatShipment } from './shared/block-io'

interface Input {
  trackingNumber: string
  includeProofOfDelivery?: boolean
  includeSignature?: boolean
}

/** Backs the UPS block `shipment.track` op — single number, flattened output. */
export default async function upsBlockTrack(input: Input): Promise<FlatShipment> {
  const { trackingNumber, includeProofOfDelivery, includeSignature } = input
  const [result] = await trackNumbers([trackingNumber], {
    returnPod: includeProofOfDelivery,
    returnSignature: includeSignature,
  })
  const { found, shipment } = mapShipment(trackingNumber, result?.pkg ?? null)
  return flattenShipment(trackingNumber, found, shipment)
}
