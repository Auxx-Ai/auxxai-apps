// src/tools/internal/collection-remove-product.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import collectionRemoveProductExecute from './collection-remove-product.tool.server'

export const collectionRemoveProductTool = defineTool({
  id: 'block_shopify_collection_remove_product',
  name: 'Shopify collection removeProduct (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: collectionRemoveProductExecute,
})
