// src/tools/internal/inventory-level-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import inventoryLevelGetManyExecute from './inventory-level-get-many.tool.server'

export const inventoryLevelGetManyTool = defineTool({
  id: 'block_shopify_inventory_level_get_many',
  name: 'Shopify inventoryLevel getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: inventoryLevelGetManyExecute,
})
