// src/tools/internal/variant-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import variantGetManyExecute from './variant-get-many.tool.server'

export const variantGetManyTool = defineTool({
  id: 'block_shopify_variant_get_many',
  name: 'Shopify variant getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: variantGetManyExecute,
})
