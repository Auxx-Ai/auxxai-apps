// src/tools/internal/shipment-get-many.tool.server.ts

import { executeShipment } from '../../blocks/shipstation/resources/shipment/shipment-execute.server'

/** Get Many: a thin delegate onto the shipment resource executor. */
export default async function shipmentGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeShipment('getMany', input)
}
