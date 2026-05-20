// src/tools/internal/customer-get.tool.server.ts

import { executeCustomer } from '../../blocks/quickbooks/resources/customer/customer-execute.server'

export default async function customerGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeCustomer('get', input as Record<string, any>)
}
