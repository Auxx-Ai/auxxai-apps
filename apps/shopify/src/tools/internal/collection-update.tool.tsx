// src/tools/internal/collection-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import collectionUpdateExecute from './collection-update.tool.server'

export const collectionUpdateTool = defineTool({
  id: 'block_shopify_collection_update',
  name: 'Shopify collection update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: collectionUpdateExecute,
})
