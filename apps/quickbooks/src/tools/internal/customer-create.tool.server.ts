// src/tools/internal/customer-create.tool.server.ts

import { executeCustomer } from '../../blocks/quickbooks/resources/customer/customer-execute.server'

export default async function customerCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeCustomer('create', input as Record<string, any>)
}
