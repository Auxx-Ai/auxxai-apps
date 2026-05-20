// src/tools/internal/metafield-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import metafieldGetExecute from './metafield-get.tool.server'

export const metafieldGetTool = defineTool({
  id: 'block_shopify_metafield_get',
  name: 'Shopify metafield get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: metafieldGetExecute,
})
