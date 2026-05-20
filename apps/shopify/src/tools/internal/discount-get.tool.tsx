// src/tools/internal/discount-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import discountGetExecute from './discount-get.tool.server'

export const discountGetTool = defineTool({
  id: 'block_shopify_discount_get',
  name: 'Shopify discount get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: discountGetExecute,
})
