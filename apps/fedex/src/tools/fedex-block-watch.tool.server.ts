// src/tools/fedex-block-watch.tool.server.ts

import watchShipment from './watch-shipment.tool.server'
import type { ShipmentStatusType } from './shared/shipment-schema'

interface Input {
  trackingNumber: string
  recordId?: string
}

/** Backs the FedEx block `shipment.watch` op — same flow as the agent tool. */
export default async function fedexBlockWatch(
  input: Input
): Promise<{ watched: boolean; currentStatus: ShipmentStatusType; expiresAt: string }> {
  return watchShipment(input)
}
