// src/tools/internal/inventory-level-connect.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import inventoryLevelConnectExecute from './inventory-level-connect.tool.server'

export const inventoryLevelConnectTool = defineTool({
  id: 'block_shopify_inventory_level_connect',
  name: 'Shopify inventoryLevel connect (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: inventoryLevelConnectExecute,
})
