// src/tools/internal/discount-get-many.tool.server.ts

import { executeDiscount } from '../../blocks/shopify/resources/discount/discount-execute.server'

export default async function discountGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDiscount('getMany', input)
}
