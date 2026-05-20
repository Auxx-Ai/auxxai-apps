// src/tools/internal/estimate-update.tool.server.ts

import { executeEstimate } from '../../blocks/quickbooks/resources/estimate/estimate-execute.server'

export default async function estimateUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEstimate('update', input as Record<string, any>)
}
