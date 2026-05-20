// src/tools/internal/draft-order-complete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import draftOrderCompleteExecute from './draft-order-complete.tool.server'

export const draftOrderCompleteTool = defineTool({
  id: 'block_shopify_draft_order_complete',
  name: 'Shopify draftOrder complete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: draftOrderCompleteExecute,
})
