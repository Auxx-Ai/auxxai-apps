// src/tools/internal/product-get.tool.server.ts

import { executeProduct } from '../../blocks/shopify/resources/product/product-execute.server'

export default async function productGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeProduct('get', input)
}
