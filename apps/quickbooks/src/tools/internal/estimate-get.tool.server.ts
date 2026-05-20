// src/tools/internal/estimate-get.tool.server.ts

import { executeEstimate } from '../../blocks/quickbooks/resources/estimate/estimate-execute.server'

export default async function estimateGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEstimate('get', input as Record<string, any>)
}
