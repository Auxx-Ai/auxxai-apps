// src/tools/internal/inventory-item-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import inventoryItemGetManyExecute from './inventory-item-get-many.tool.server'

export const inventoryItemGetManyTool = defineTool({
  id: 'block_shopify_inventory_item_get_many',
  name: 'Shopify inventoryItem getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: inventoryItemGetManyExecute,
})
