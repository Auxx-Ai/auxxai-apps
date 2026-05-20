// src/tools/internal/bill-delete.tool.server.ts

import { executeBill } from '../../blocks/quickbooks/resources/bill/bill-execute.server'

export default async function billDelete(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeBill('delete', input as Record<string, any>)
}
