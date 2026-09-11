// src/tools/internal/rate-estimate.tool.server.ts

import { executeRate } from '../../blocks/shipstation/resources/rate/rate-execute.server'

export default async function rateEstimateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeRate('estimate', input)
}
