// src/tools/internal/customer-get-many.tool.server.ts

import { executeCustomer } from '../../blocks/quickbooks/resources/customer/customer-execute.server'

export default async function customerGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeCustomer('getMany', input as Record<string, any>)
}
