// src/tools/internal/shipment-get.tool.server.ts

import { executeShipment } from '../../blocks/shipstation/resources/shipment/shipment-execute.server'

/** Get: a thin delegate onto the shipment resource executor. */
export default async function shipmentGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeShipment('get', input)
}
