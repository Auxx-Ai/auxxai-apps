// src/tools/internal/inventory-item-get-many.tool.server.ts

import { executeInventoryItem } from '../../blocks/shopify/resources/inventory-item/inventory-item-execute.server'

export default async function inventoryItemGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeInventoryItem('getMany', input)
}
