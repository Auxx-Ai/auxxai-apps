// src/tools/internal/variant-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import variantGetExecute from './variant-get.tool.server'

export const variantGetTool = defineTool({
  id: 'block_shopify_variant_get',
  name: 'Shopify variant get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: variantGetExecute,
})
