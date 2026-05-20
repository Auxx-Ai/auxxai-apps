// src/tools/internal/customer-address-update.tool.server.ts

import { executeCustomerAddress } from '../../blocks/shopify/resources/customer-address/customer-address-execute.server'

export default async function customerAddressUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomerAddress('update', input)
}
