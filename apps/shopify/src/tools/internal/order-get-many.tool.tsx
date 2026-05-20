// src/tools/internal/order-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import orderGetManyExecute from './order-get-many.tool.server'

export const orderGetManyTool = defineTool({
  id: 'block_shopify_order_get_many',
  name: 'Shopify order getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: orderGetManyExecute,
})
