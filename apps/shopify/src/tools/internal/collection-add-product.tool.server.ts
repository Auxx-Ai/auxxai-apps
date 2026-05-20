// src/tools/internal/collection-add-product.tool.server.ts

import { executeCollection } from '../../blocks/shopify/resources/collection/collection-execute.server'

export default async function collectionAddProductExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCollection('addProduct', input)
}
