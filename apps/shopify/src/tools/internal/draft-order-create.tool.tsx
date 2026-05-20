// src/tools/internal/draft-order-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import draftOrderCreateExecute from './draft-order-create.tool.server'

export const draftOrderCreateTool = defineTool({
  id: 'block_shopify_draft_order_create',
  name: 'Shopify draftOrder create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: draftOrderCreateExecute,
})
