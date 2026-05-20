// src/tools/internal/customer-address-create.tool.server.ts

import { executeCustomerAddress } from '../../blocks/shopify/resources/customer-address/customer-address-execute.server'

export default async function customerAddressCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCustomerAddress('create', input)
}
