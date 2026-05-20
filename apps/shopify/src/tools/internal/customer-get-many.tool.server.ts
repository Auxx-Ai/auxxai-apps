// src/tools/internal/customer-get-many.tool.server.ts

import { executeCustomer } from '../../blocks/shopify/resources/customer/customer-execute.server'

export default async function customerGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomer('getMany', input)
}
