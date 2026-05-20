// src/tools/internal/bill-get-many.tool.server.ts

import { executeBill } from '../../blocks/quickbooks/resources/bill/bill-execute.server'

export default async function billGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeBill('getMany', input as Record<string, any>)
}
