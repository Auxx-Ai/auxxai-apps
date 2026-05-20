// src/tools/internal/customer-address-delete.tool.server.ts

import { executeCustomerAddress } from '../../blocks/shopify/resources/customer-address/customer-address-execute.server'

export default async function customerAddressDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomerAddress('delete', input)
}
