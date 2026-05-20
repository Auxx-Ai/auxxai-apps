// src/tools/internal/collection-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import collectionCreateExecute from './collection-create.tool.server'

export const collectionCreateTool = defineTool({
  id: 'block_shopify_collection_create',
  name: 'Shopify collection create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: collectionCreateExecute,
})
