// src/tools/internal/product-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import productUpdateExecute from './product-update.tool.server'

export const productUpdateTool = defineTool({
  id: 'block_shopify_product_update',
  name: 'Shopify product update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: productUpdateExecute,
})
