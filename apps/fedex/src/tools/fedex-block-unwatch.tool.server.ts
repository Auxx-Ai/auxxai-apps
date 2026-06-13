// src/tools/fedex-block-unwatch.tool.server.ts

import unwatchShipment from './unwatch-shipment.tool.server'

interface Input {
  trackingNumber: string
}

/** Backs the FedEx block `shipment.unwatch` op. */
export default async function fedexBlockUnwatch(input: Input): Promise<{ removed: boolean }> {
  return unwatchShipment(input)
}
