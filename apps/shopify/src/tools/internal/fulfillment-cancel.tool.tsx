// src/tools/internal/fulfillment-cancel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import fulfillmentCancelExecute from './fulfillment-cancel.tool.server'

export const fulfillmentCancelTool = defineTool({
  id: 'block_shopify_fulfillment_cancel',
  name: 'Shopify fulfillment cancel (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: fulfillmentCancelExecute,
})
