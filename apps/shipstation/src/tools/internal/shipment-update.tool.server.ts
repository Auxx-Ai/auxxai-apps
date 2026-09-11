// src/tools/internal/shipment-update.tool.server.ts

import { executeShipment } from '../../blocks/shipstation/resources/shipment/shipment-execute.server'

/** Update: a thin delegate onto the shipment resource executor. */
export default async function shipmentUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeShipment('update', input)
}
