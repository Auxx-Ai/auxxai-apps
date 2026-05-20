// src/tools/internal/order-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import orderUpdateExecute from './order-update.tool.server'

export const orderUpdateTool = defineTool({
  id: 'block_shopify_order_update',
  name: 'Shopify order update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: orderUpdateExecute,
})
