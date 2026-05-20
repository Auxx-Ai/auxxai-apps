// src/tools/internal/customer-search.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerSearchExecute from './customer-search.tool.server'

export const customerSearchTool = defineTool({
  id: 'block_shopify_customer_search',
  name: 'Shopify customer search (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerSearchExecute,
})
