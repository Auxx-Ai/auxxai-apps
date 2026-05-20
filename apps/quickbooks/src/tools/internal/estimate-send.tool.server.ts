// src/tools/internal/estimate-send.tool.server.ts

import { executeEstimate } from '../../blocks/quickbooks/resources/estimate/estimate-execute.server'

export default async function estimateSend(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeEstimate('send', input as Record<string, any>)
}
