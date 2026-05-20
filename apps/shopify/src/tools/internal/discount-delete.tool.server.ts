// src/tools/internal/discount-delete.tool.server.ts

import { executeDiscount } from '../../blocks/shopify/resources/discount/discount-execute.server'

export default async function discountDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDiscount('delete', input)
}
