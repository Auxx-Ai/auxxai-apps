// src/tools/internal/discount-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import discountDeleteExecute from './discount-delete.tool.server'

export const discountDeleteTool = defineTool({
  id: 'block_shopify_discount_delete',
  name: 'Shopify discount delete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: discountDeleteExecute,
})
