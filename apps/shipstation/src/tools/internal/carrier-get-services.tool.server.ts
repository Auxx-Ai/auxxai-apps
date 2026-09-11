// src/tools/internal/carrier-get-services.tool.server.ts

import { executeCarrier } from '../../blocks/shipstation/resources/carrier/carrier-execute.server'

export default async function carrierGetServicesExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCarrier('getServices', input)
}
