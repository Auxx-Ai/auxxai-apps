// src/tools/internal/customer-address-set-default.tool.server.ts

import { executeCustomerAddress } from '../../blocks/shopify/resources/customer-address/customer-address-execute.server'

export default async function customerAddressSetDefaultExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomerAddress('setDefault', input)
}
