// src/tools/internal/product-delete.tool.server.ts

import { executeProduct } from '../../blocks/shopify/resources/product/product-execute.server'

export default async function productDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeProduct('delete', input)
}
