// src/tools/internal/product-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import productCreateExecute from './product-create.tool.server'

export const productCreateTool = defineTool({
  id: 'block_shopify_product_create',
  name: 'Shopify product create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: productCreateExecute,
})
