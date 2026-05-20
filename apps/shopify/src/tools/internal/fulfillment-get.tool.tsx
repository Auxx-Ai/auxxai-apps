// src/tools/internal/fulfillment-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import fulfillmentGetExecute from './fulfillment-get.tool.server'

export const fulfillmentGetTool = defineTool({
  id: 'block_shopify_fulfillment_get',
  name: 'Shopify fulfillment get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: fulfillmentGetExecute,
})
