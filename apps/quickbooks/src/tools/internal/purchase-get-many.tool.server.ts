// src/tools/internal/purchase-get-many.tool.server.ts

import { executePurchase } from '../../blocks/quickbooks/resources/purchase/purchase-execute.server'

export default async function purchaseGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executePurchase('getMany', input as Record<string, any>)
}
