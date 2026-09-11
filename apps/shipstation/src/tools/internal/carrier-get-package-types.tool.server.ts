// src/tools/internal/carrier-get-package-types.tool.server.ts

import { executeCarrier } from '../../blocks/shipstation/resources/carrier/carrier-execute.server'

export default async function carrierGetPackageTypesExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCarrier('getPackageTypes', input)
}
