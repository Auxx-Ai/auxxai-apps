// src/tools/internal/inventory-level-connect.tool.server.ts

import { executeInventoryLevel } from '../../blocks/shopify/resources/inventory-level/inventory-level-execute.server'

export default async function inventoryLevelConnectExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeInventoryLevel('connect', input)
}
