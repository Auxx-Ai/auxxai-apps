// src/tools/unwatch-shipment.tool.server.ts

import { removeWatch } from './shared/watches'

interface UnwatchShipmentInput {
  trackingNumber: string
}

export default async function unwatchShipment(
  input: UnwatchShipmentInput
): Promise<{ removed: boolean }> {
  const removed = await removeWatch(input.trackingNumber)
  return { removed }
}
