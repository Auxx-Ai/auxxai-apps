// src/tools/internal/draft-order-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import draftOrderGetManyExecute from './draft-order-get-many.tool.server'

export const draftOrderGetManyTool = defineTool({
  id: 'block_shopify_draft_order_get_many',
  name: 'Shopify draftOrder getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: draftOrderGetManyExecute,
})
