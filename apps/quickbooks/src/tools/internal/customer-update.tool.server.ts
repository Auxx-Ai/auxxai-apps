// src/tools/internal/customer-update.tool.server.ts

import { executeCustomer } from '../../blocks/quickbooks/resources/customer/customer-execute.server'

export default async function customerUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeCustomer('update', input as Record<string, any>)
}
