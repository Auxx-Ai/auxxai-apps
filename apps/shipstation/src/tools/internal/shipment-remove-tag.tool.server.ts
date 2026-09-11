// src/tools/internal/shipment-remove-tag.tool.server.ts

import { executeShipment } from '../../blocks/shipstation/resources/shipment/shipment-execute.server'

/** Remove Tag: a thin delegate onto the shipment resource executor. */
export default async function shipmentRemoveTagExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeShipment('removeTag', input)
}
