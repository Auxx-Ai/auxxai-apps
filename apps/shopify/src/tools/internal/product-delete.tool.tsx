// src/tools/internal/product-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import productDeleteExecute from './product-delete.tool.server'

export const productDeleteTool = defineTool({
  id: 'block_shopify_product_delete',
  name: 'Shopify product delete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: productDeleteExecute,
})
