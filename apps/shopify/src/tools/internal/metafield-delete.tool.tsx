// src/tools/internal/metafield-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import metafieldDeleteExecute from './metafield-delete.tool.server'

export const metafieldDeleteTool = defineTool({
  id: 'block_shopify_metafield_delete',
  name: 'Shopify metafield delete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: metafieldDeleteExecute,
})
