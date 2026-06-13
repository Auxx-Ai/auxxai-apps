// src/tools/fedex-block-track.tool.server.ts

import { trackByNumbers } from './shared/fedex-api'
import { mapShipment } from './shared/map-shipment'
import { flattenShipment, type FlatShipment } from './shared/block-io'

interface Input {
  trackingNumber: string
  shipDateBegin?: string
  shipDateEnd?: string
}

/** Backs the FedEx block `shipment.track` op — single number, flattened output. */
export default async function fedexBlockTrack(input: Input): Promise<FlatShipment> {
  const { trackingNumber, shipDateBegin, shipDateEnd } = input
  const [result] = await trackByNumbers([
    {
      trackingNumberInfo: { trackingNumber },
      ...(shipDateBegin ? { shipDateBegin } : {}),
      ...(shipDateEnd ? { shipDateEnd } : {}),
    },
  ])
  const { found, shipment } = mapShipment(trackingNumber, result?.trackResults ?? [])
  return flattenShipment(trackingNumber, found, shipment, found ? 1 : 0)
}
