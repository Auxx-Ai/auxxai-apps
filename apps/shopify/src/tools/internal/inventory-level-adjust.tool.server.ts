// src/tools/internal/inventory-level-adjust.tool.server.ts

import { executeInventoryLevel } from '../../blocks/shopify/resources/inventory-level/inventory-level-execute.server'

export default async function inventoryLevelAdjustExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeInventoryLevel('adjust', input)
}
