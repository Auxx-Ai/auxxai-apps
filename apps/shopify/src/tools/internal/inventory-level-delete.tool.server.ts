// src/tools/internal/inventory-level-delete.tool.server.ts

import { executeInventoryLevel } from '../../blocks/shopify/resources/inventory-level/inventory-level-execute.server'

export default async function inventoryLevelDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeInventoryLevel('delete', input)
}
