// src/tools/internal/inventory-item-update.tool.server.ts

import { executeInventoryItem } from '../../blocks/shopify/resources/inventory-item/inventory-item-execute.server'

export default async function inventoryItemUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeInventoryItem('update', input)
}
