// src/tools/internal/inventory-level-adjust.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import inventoryLevelAdjustExecute from './inventory-level-adjust.tool.server'

export const inventoryLevelAdjustTool = defineTool({
  id: 'block_shopify_inventory_level_adjust',
  name: 'Shopify inventoryLevel adjust (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: inventoryLevelAdjustExecute,
})
