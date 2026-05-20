// src/tools/internal/metafield-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import metafieldCreateExecute from './metafield-create.tool.server'

export const metafieldCreateTool = defineTool({
  id: 'block_shopify_metafield_create',
  name: 'Shopify metafield create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: metafieldCreateExecute,
})
