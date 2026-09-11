// src/tools/internal/tracking-get.tool.server.ts

import { executeTracking } from '../../blocks/shipstation/resources/tracking/tracking-execute.server'

export default async function trackingGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeTracking('get', input)
}
