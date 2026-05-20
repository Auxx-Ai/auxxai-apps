// src/tools/internal/product-get-many.tool.server.ts

import { executeProduct } from '../../blocks/shopify/resources/product/product-execute.server'

export default async function productGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeProduct('getMany', input)
}
