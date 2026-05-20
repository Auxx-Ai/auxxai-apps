// src/tools/internal/order-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import orderDeleteExecute from './order-delete.tool.server'

export const orderDeleteTool = defineTool({
  id: 'block_shopify_order_delete',
  name: 'Shopify order delete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: orderDeleteExecute,
})
