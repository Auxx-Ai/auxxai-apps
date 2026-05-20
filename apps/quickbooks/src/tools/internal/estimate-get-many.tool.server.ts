// src/tools/internal/estimate-get-many.tool.server.ts

import { executeEstimate } from '../../blocks/quickbooks/resources/estimate/estimate-execute.server'

export default async function estimateGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEstimate('getMany', input as Record<string, any>)
}
