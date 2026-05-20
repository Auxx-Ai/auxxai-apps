// src/tools/internal/discount-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import discountUpdateExecute from './discount-update.tool.server'

export const discountUpdateTool = defineTool({
  id: 'block_shopify_discount_update',
  name: 'Shopify discount update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: discountUpdateExecute,
})
