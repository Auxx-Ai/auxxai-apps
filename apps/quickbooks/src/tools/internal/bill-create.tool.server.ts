// src/tools/internal/bill-create.tool.server.ts

import { executeBill } from '../../blocks/quickbooks/resources/bill/bill-execute.server'

export default async function billCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeBill('create', input as Record<string, any>)
}
