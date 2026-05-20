// src/tools/internal/customer-search.tool.server.ts

import { executeCustomer } from '../../blocks/shopify/resources/customer/customer-execute.server'

export default async function customerSearchExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomer('search', input)
}
