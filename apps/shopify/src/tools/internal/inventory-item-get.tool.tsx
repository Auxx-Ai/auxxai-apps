// src/tools/internal/inventory-item-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import inventoryItemGetExecute from './inventory-item-get.tool.server'

export const inventoryItemGetTool = defineTool({
  id: 'block_shopify_inventory_item_get',
  name: 'Shopify inventoryItem get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: inventoryItemGetExecute,
})
