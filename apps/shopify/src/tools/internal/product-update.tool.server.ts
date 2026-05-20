// src/tools/internal/product-update.tool.server.ts

import { executeProduct } from '../../blocks/shopify/resources/product/product-execute.server'

export default async function productUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeProduct('update', input)
}
