// src/tools/internal/collection-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import collectionGetExecute from './collection-get.tool.server'

export const collectionGetTool = defineTool({
  id: 'block_shopify_collection_get',
  name: 'Shopify collection get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: collectionGetExecute,
})
