// src/tools/internal/draft-order-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import draftOrderGetExecute from './draft-order-get.tool.server'

export const draftOrderGetTool = defineTool({
  id: 'block_shopify_draft_order_get',
  name: 'Shopify draftOrder get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: draftOrderGetExecute,
})
