// src/tools/ups-block-watch.tool.server.ts

import watchShipment from './watch-shipment.tool.server'
import type { ShipmentStatusType } from './shared/shipment-schema'

interface Input {
  trackingNumber: string
  recordId?: string
}

/** Backs the UPS block `shipment.watch` op — same flow as the agent tool. */
export default async function upsBlockWatch(
  input: Input
): Promise<{ watched: boolean; currentStatus: ShipmentStatusType; expiresAt: string }> {
  return watchShipment(input)
}
