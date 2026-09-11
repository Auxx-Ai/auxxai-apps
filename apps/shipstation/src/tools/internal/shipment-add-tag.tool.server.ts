// src/tools/internal/shipment-add-tag.tool.server.ts

import { executeShipment } from '../../blocks/shipstation/resources/shipment/shipment-execute.server'

/** Add Tag: a thin delegate onto the shipment resource executor. */
export default async function shipmentAddTagExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeShipment('addTag', input)
}
