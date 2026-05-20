// src/tools/internal/discount-create.tool.server.ts

import { executeDiscount } from '../../blocks/shopify/resources/discount/discount-execute.server'

export default async function discountCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDiscount('create', input)
}
