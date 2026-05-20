// src/tools/internal/metafield-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import metafieldUpdateExecute from './metafield-update.tool.server'

export const metafieldUpdateTool = defineTool({
  id: 'block_shopify_metafield_update',
  name: 'Shopify metafield update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: metafieldUpdateExecute,
})
