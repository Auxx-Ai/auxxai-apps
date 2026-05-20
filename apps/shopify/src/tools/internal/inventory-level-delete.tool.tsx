// src/tools/internal/inventory-level-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import inventoryLevelDeleteExecute from './inventory-level-delete.tool.server'

export const inventoryLevelDeleteTool = defineTool({
  id: 'block_shopify_inventory_level_delete',
  name: 'Shopify inventoryLevel delete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: inventoryLevelDeleteExecute,
})
