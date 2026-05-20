// src/tools/internal/discount-get.tool.server.ts

import { executeDiscount } from '../../blocks/shopify/resources/discount/discount-execute.server'

export default async function discountGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDiscount('get', input)
}
