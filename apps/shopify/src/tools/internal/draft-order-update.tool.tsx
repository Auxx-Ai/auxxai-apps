// src/tools/internal/draft-order-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import draftOrderUpdateExecute from './draft-order-update.tool.server'

export const draftOrderUpdateTool = defineTool({
  id: 'block_shopify_draft_order_update',
  name: 'Shopify draftOrder update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: draftOrderUpdateExecute,
})
