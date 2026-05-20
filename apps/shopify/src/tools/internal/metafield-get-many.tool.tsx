// src/tools/internal/metafield-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import metafieldGetManyExecute from './metafield-get-many.tool.server'

export const metafieldGetManyTool = defineTool({
  id: 'block_shopify_metafield_get_many',
  name: 'Shopify metafield getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: metafieldGetManyExecute,
})
