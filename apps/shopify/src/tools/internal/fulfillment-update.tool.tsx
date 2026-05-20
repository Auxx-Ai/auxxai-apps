// src/tools/internal/fulfillment-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import fulfillmentUpdateExecute from './fulfillment-update.tool.server'

export const fulfillmentUpdateTool = defineTool({
  id: 'block_shopify_fulfillment_update',
  name: 'Shopify fulfillment update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: fulfillmentUpdateExecute,
})
