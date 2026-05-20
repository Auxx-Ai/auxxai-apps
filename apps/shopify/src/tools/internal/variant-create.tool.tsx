// src/tools/internal/variant-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import variantCreateExecute from './variant-create.tool.server'

export const variantCreateTool = defineTool({
  id: 'block_shopify_variant_create',
  name: 'Shopify variant create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: variantCreateExecute,
})
