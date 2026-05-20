// src/tools/internal/collection-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import collectionDeleteExecute from './collection-delete.tool.server'

export const collectionDeleteTool = defineTool({
  id: 'block_shopify_collection_delete',
  name: 'Shopify collection delete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: collectionDeleteExecute,
})
