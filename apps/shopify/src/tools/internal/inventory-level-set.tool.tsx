// src/tools/internal/inventory-level-set.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import inventoryLevelSetExecute from './inventory-level-set.tool.server'

export const inventoryLevelSetTool = defineTool({
  id: 'block_shopify_inventory_level_set',
  name: 'Shopify inventoryLevel set (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: inventoryLevelSetExecute,
})
