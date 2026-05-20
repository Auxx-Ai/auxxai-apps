// src/tools/internal/order-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import orderCreateExecute from './order-create.tool.server'

export const orderCreateTool = defineTool({
  id: 'block_shopify_order_create',
  name: 'Shopify order create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: orderCreateExecute,
})
