// src/tools/internal/order-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import orderGetExecute from './order-get.tool.server'

export const orderGetTool = defineTool({
  id: 'block_shopify_order_get',
  name: 'Shopify order get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: orderGetExecute,
})
