// src/tools/internal/customer-create.tool.server.ts

import { executeCustomer } from '../../blocks/shopify/resources/customer/customer-execute.server'

export default async function customerCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomer('create', input)
}
