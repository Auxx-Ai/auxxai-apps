// src/tools/internal/discount-update.tool.server.ts

import { executeDiscount } from '../../blocks/shopify/resources/discount/discount-execute.server'

export default async function discountUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDiscount('update', input)
}
