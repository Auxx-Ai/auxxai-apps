// src/tools/internal/product-create.tool.server.ts

import { executeProduct } from '../../blocks/shopify/resources/product/product-execute.server'

export default async function productCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeProduct('create', input)
}
