// src/tools/internal/bill-update.tool.server.ts

import { executeBill } from '../../blocks/quickbooks/resources/bill/bill-execute.server'

export default async function billUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeBill('update', input as Record<string, any>)
}
