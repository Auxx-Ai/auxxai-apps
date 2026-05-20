// src/tools/internal/estimate-delete.tool.server.ts

import { executeEstimate } from '../../blocks/quickbooks/resources/estimate/estimate-execute.server'

export default async function estimateDelete(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEstimate('delete', input as Record<string, any>)
}
