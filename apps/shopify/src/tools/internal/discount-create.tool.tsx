// src/tools/internal/discount-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import discountCreateExecute from './discount-create.tool.server'

export const discountCreateTool = defineTool({
  id: 'block_shopify_discount_create',
  name: 'Shopify discount create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: discountCreateExecute,
})
