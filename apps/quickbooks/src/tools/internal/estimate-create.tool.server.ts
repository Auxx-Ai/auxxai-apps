// src/tools/internal/estimate-create.tool.server.ts

import { executeEstimate } from '../../blocks/quickbooks/resources/estimate/estimate-execute.server'

export default async function estimateCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEstimate('create', input as Record<string, any>)
}
