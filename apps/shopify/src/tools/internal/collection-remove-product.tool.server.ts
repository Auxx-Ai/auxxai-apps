// src/tools/internal/collection-remove-product.tool.server.ts

import { executeCollection } from '../../blocks/shopify/resources/collection/collection-execute.server'

export default async function collectionRemoveProductExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCollection('removeProduct', input)
}
