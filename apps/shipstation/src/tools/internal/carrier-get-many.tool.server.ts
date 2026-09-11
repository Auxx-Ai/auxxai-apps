// src/tools/internal/carrier-get-many.tool.server.ts

import { executeCarrier } from '../../blocks/shipstation/resources/carrier/carrier-execute.server'

export default async function carrierGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCarrier('getMany', input)
}
