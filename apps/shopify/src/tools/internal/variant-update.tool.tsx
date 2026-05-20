// src/tools/internal/variant-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import variantUpdateExecute from './variant-update.tool.server'

export const variantUpdateTool = defineTool({
  id: 'block_shopify_variant_update',
  name: 'Shopify variant update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: variantUpdateExecute,
})
