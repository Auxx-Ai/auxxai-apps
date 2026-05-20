// src/tools/internal/bill-get.tool.server.ts

import { executeBill } from '../../blocks/quickbooks/resources/bill/bill-execute.server'

export default async function billGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeBill('get', input as Record<string, any>)
}
