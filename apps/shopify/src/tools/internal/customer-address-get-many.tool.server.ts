// src/tools/internal/customer-address-get-many.tool.server.ts

import { executeCustomerAddress } from '../../blocks/shopify/resources/customer-address/customer-address-execute.server'

export default async function customerAddressGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomerAddress('getMany', input)
}
