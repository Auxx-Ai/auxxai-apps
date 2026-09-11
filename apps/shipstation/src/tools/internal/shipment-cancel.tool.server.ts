// src/tools/internal/shipment-cancel.tool.server.ts

import { executeShipment } from '../../blocks/shipstation/resources/shipment/shipment-execute.server'

/** Cancel: a thin delegate onto the shipment resource executor. */
export default async function shipmentCancelExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeShipment('cancel', input)
}
