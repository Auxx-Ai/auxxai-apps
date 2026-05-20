// src/tools/internal/purchase-get.tool.server.ts

import { executePurchase } from '../../blocks/quickbooks/resources/purchase/purchase-execute.server'

export default async function purchaseGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePurchase('get', input as Record<string, any>)
}
