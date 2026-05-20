// src/tools/internal/customer-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerGetExecute from './customer-get.tool.server'

export const customerGetTool = defineTool({
  id: 'block_shopify_customer_get',
  name: 'Shopify customer get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerGetExecute,
})
