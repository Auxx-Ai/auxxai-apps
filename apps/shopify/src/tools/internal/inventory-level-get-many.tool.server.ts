// src/tools/internal/inventory-level-get-many.tool.server.ts

import { executeInventoryLevel } from '../../blocks/shopify/resources/inventory-level/inventory-level-execute.server'

export default async function inventoryLevelGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeInventoryLevel('getMany', input)
}
