// src/tools/internal/shipment-create.tool.server.ts

import { executeShipment } from '../../blocks/shipstation/resources/shipment/shipment-execute.server'

/** Create: a thin delegate onto the shipment resource executor. */
export default async function shipmentCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeShipment('create', input)
}
