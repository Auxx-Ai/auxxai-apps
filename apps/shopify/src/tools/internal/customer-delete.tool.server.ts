// src/tools/internal/customer-delete.tool.server.ts

import { executeCustomer } from '../../blocks/shopify/resources/customer/customer-execute.server'

export default async function customerDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomer('delete', input)
}
