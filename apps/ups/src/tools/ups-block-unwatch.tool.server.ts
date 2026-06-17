// src/tools/ups-block-unwatch.tool.server.ts

import unwatchShipment from './unwatch-shipment.tool.server'

interface Input {
  trackingNumber: string
}

/** Backs the UPS block `shipment.unwatch` op. */
export default async function upsBlockUnwatch(input: Input): Promise<{ removed: boolean }> {
  return unwatchShipment(input)
}
