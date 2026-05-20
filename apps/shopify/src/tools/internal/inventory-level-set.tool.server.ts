// src/tools/internal/inventory-level-set.tool.server.ts

import { executeInventoryLevel } from '../../blocks/shopify/resources/inventory-level/inventory-level-execute.server'

export default async function inventoryLevelSetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeInventoryLevel('set', input)
}
