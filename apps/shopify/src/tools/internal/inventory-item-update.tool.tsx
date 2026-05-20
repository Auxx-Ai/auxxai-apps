// src/tools/internal/inventory-item-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import inventoryItemUpdateExecute from './inventory-item-update.tool.server'

export const inventoryItemUpdateTool = defineTool({
  id: 'block_shopify_inventory_item_update',
  name: 'Shopify inventoryItem update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: inventoryItemUpdateExecute,
})
