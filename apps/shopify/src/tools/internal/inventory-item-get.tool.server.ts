// src/tools/internal/inventory-item-get.tool.server.ts

import { executeInventoryItem } from '../../blocks/shopify/resources/inventory-item/inventory-item-execute.server'

export default async function inventoryItemGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeInventoryItem('get', input)
}
