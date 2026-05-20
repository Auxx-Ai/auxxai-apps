// src/tools/internal/collection-add-product.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import collectionAddProductExecute from './collection-add-product.tool.server'

export const collectionAddProductTool = defineTool({
  id: 'block_shopify_collection_add_product',
  name: 'Shopify collection addProduct (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: collectionAddProductExecute,
})
