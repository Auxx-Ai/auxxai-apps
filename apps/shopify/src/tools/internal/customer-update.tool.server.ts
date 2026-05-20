// src/tools/internal/customer-update.tool.server.ts

import { executeCustomer } from '../../blocks/shopify/resources/customer/customer-execute.server'

export default async function customerUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomer('update', input)
}
