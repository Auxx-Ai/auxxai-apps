// src/tools/internal/discount-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import discountGetManyExecute from './discount-get-many.tool.server'

export const discountGetManyTool = defineTool({
  id: 'block_shopify_discount_get_many',
  name: 'Shopify discount getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: discountGetManyExecute,
})
