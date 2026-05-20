// src/tools/internal/collection-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import collectionGetManyExecute from './collection-get-many.tool.server'

export const collectionGetManyTool = defineTool({
  id: 'block_shopify_collection_get_many',
  name: 'Shopify collection getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: collectionGetManyExecute,
})
