// src/tools/internal/fulfillment-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import fulfillmentGetManyExecute from './fulfillment-get-many.tool.server'

export const fulfillmentGetManyTool = defineTool({
  id: 'block_shopify_fulfillment_get_many',
  name: 'Shopify fulfillment getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: fulfillmentGetManyExecute,
})
