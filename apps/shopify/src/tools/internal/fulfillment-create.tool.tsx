// src/tools/internal/fulfillment-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import fulfillmentCreateExecute from './fulfillment-create.tool.server'

export const fulfillmentCreateTool = defineTool({
  id: 'block_shopify_fulfillment_create',
  name: 'Shopify fulfillment create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: fulfillmentCreateExecute,
})
