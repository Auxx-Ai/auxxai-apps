// src/tools/internal/customer-get.tool.server.ts

import { executeCustomer } from '../../blocks/shopify/resources/customer/customer-execute.server'

export default async function customerGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomer('get', input)
}
