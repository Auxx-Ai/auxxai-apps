// src/tools/internal/product-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import productGetExecute from './product-get.tool.server'

export const productGetTool = defineTool({
  id: 'block_shopify_product_get',
  name: 'Shopify product get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: productGetExecute,
})
