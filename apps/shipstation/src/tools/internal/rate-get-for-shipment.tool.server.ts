// src/tools/internal/rate-get-for-shipment.tool.server.ts

import { executeRate } from '../../blocks/shipstation/resources/rate/rate-execute.server'

export default async function rateGetForShipmentExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeRate('getForShipment', input)
}
