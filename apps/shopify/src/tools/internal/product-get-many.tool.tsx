// src/tools/internal/product-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import productGetManyExecute from './product-get-many.tool.server'

export const productGetManyTool = defineTool({
  id: 'block_shopify_product_get_many',
  name: 'Shopify product getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: productGetManyExecute,
})
